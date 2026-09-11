package main

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"html"
	"io"
	"regexp"
	"strconv"
	"strings"
)

// =============================================================================
//  Word(.docx) 导出：公文排版，仿 模板.docx
//  A4 + 同页边距；正文仿宋四号、首行缩进 2 字符、固定行距 28 磅；
//  一级标题黑体、二级楷体、三级仿宋；策划案自动套用封面；预算以真实表格；不导出待确认清单
// =============================================================================

const (
	fontBody = "仿宋"
	fontHei  = "黑体"
	fontKai  = "楷体"
	fontXBS  = "方正小标宋简体"

	szH1    = 28 // 四号 14pt = 28 半磅
	szNote  = 24 // 小四 12pt
	szTitle = 44 // 二号 22pt
)

var (
	reLeadingHash  = regexp.MustCompile(`^#{1,6}\s*`)
	reHeadingLevel = regexp.MustCompile(`^(#{1,6})\s+`)
	reLeadingItem  = regexp.MustCompile(`^\s*[-*•]\s+`)
	reBold         = regexp.MustCompile(`\*\*(.+?)\*\*`)
	reEm           = regexp.MustCompile(`\*(.+?)\*`)
	reCode         = regexp.MustCompile("`([^`]+)`")
	reLink         = regexp.MustCompile(`!?\[([^\]]*)\]\([^)]*\)`)
	reSpaces       = regexp.MustCompile(`\s+`)
	reL1           = regexp.MustCompile(`^[一二三四五六七八九十]+[、．.]`)
	reL2           = regexp.MustCompile(`^（[一二三四五六七八九十]+）`)
	reHR           = regexp.MustCompile(`^(-{3,}|\*{3,}|_{3,})$`)
	reSepCell      = regexp.MustCompile(`^:?-+:?$`)
	reBullet       = regexp.MustCompile(`^([-*•])\s+(.*)$`)
	reNumItem      = regexp.MustCompile(`^(\d+)[.、)]\s+(.*)$`)
	reBookTitle    = regexp.MustCompile(`策\s*划\s*书`)
	reBlankRuns    = regexp.MustCompile(`\n{3,}`)
	reAnyTag       = regexp.MustCompile(`(?s)<[^>]*>`)
	reZeroWidth    = regexp.MustCompile("\u0000")
)

func xmlEscape(s string) string {
	var b strings.Builder
	_ = xml.EscapeText(&b, []byte(s))
	return b.String()
}

// mdText 去掉会残留的 markdown 符号
func mdText(s string) string {
	s = reLeadingHash.ReplaceAllString(s, "")
	s = reLeadingItem.ReplaceAllString(s, "")
	s = reBold.ReplaceAllString(s, "$1")
	s = reEm.ReplaceAllString(s, "$1")
	s = reCode.ReplaceAllString(s, "$1")
	s = reLink.ReplaceAllString(s, "$1")
	s = strings.ReplaceAll(s, "|", "")
	s = reSpaces.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func stripInline(s string) string {
	s = reEm.ReplaceAllString(s, "$1")
	s = reCode.ReplaceAllString(s, "$1")
	s = reLink.ReplaceAllString(s, "$1")
	return s
}

func runXML(text, font string, sizeHP int, bold bool) string {
	if text == "" {
		return ""
	}
	rpr := `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="` + font + `" w:cs="` + font + `"/>`
	if bold {
		rpr += `<w:b/><w:bCs/>`
	}
	rpr += `<w:sz w:val="` + strconv.Itoa(sizeHP) + `"/><w:szCs w:val="` + strconv.Itoa(sizeHP) + `"/></w:rPr>`
	return `<w:r>` + rpr + `<w:t xml:space="preserve">` + xmlEscape(text) + `</w:t></w:r>`
}

// inlineRuns 保留 **加粗** 的行内格式
func inlineRuns(text, font string, sizeHP int) string {
	var sb strings.Builder
	last := 0
	for _, m := range reBold.FindAllStringSubmatchIndex(text, -1) {
		if m[0] > last {
			sb.WriteString(runXML(stripInline(text[last:m[0]]), font, sizeHP, false))
		}
		sb.WriteString(runXML(stripInline(text[m[2]:m[3]]), font, sizeHP, true))
		last = m[1]
	}
	if last < len(text) {
		sb.WriteString(runXML(stripInline(text[last:]), font, sizeHP, false))
	}
	if sb.Len() == 0 {
		sb.WriteString(runXML("", font, sizeHP, false))
	}
	return sb.String()
}

type paraOpts struct {
	align     string // "center" 或空
	firstLine int    // twips
	pageBreak bool
	line      int    // twips（560 = 28 磅）
	lineRule  string // "exact" | "auto"
	before    int
	after     int
	noIndent  bool
}

func paraXML(runs string, o paraOpts) string {
	var ppr strings.Builder
	ppr.WriteString("<w:pPr>")
	if o.pageBreak {
		ppr.WriteString("<w:pageBreakBefore/>")
	}
	if o.line > 0 {
		ppr.WriteString("<w:spacing")
		if o.before > 0 {
			ppr.WriteString(` w:before="` + strconv.Itoa(o.before) + `"`)
		}
		if o.after > 0 {
			ppr.WriteString(` w:after="` + strconv.Itoa(o.after) + `"`)
		}
		ppr.WriteString(` w:line="` + strconv.Itoa(o.line) + `" w:lineRule="` + o.lineRule + `"/>`)
	}
	if !o.noIndent && o.firstLine > 0 {
		ppr.WriteString(`<w:ind w:firstLine="` + strconv.Itoa(o.firstLine) + `"/>`)
	}
	if o.align != "" {
		ppr.WriteString(`<w:jc w:val="` + o.align + `"/>`)
	}
	ppr.WriteString("</w:pPr>")
	return "<w:p>" + ppr.String() + runs + "</w:p>"
}

func bodyPara(runs string, pageBreak bool) string {
	return paraXML(runs, paraOpts{line: 560, lineRule: "exact", firstLine: 560, pageBreak: pageBreak})
}

func coverPara(text string, sizeHP int, font string, bold bool, before, after int) string {
	return paraXML(runXML(text, font, sizeHP, bold), paraOpts{
		align: "center", line: 360, lineRule: "auto", before: before, after: after, noIndent: true,
	})
}

func tableCells(line string) []string {
	s := strings.TrimSpace(line)
	s = strings.TrimPrefix(s, "|")
	s = strings.TrimSuffix(s, "|")
	parts := strings.Split(s, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		out = append(out, strings.TrimSpace(p))
	}
	return out
}

func isTableSepRow(line string) bool {
	cells := tableCells(line)
	if len(cells) == 0 {
		return false
	}
	for _, c := range cells {
		if !reSepCell.MatchString(c) {
			return false
		}
	}
	return true
}

// tableXML 把预算等 Markdown 表格渲染为真实 Word 表格
func tableXML(rows [][]string) string {
	ncol := 0
	for _, r := range rows {
		if len(r) > ncol {
			ncol = len(r)
		}
	}
	if ncol == 0 {
		return ""
	}
	edge := `<w:top w:val="single" w:sz="4" w:color="7F7F7F"/><w:left w:val="single" w:sz="4" w:color="7F7F7F"/><w:bottom w:val="single" w:sz="4" w:color="7F7F7F"/><w:right w:val="single" w:sz="4" w:color="7F7F7F"/>`
	var sb strings.Builder
	sb.WriteString(`<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>` + edge +
		`<w:insideH w:val="single" w:sz="4" w:color="7F7F7F"/><w:insideV w:val="single" w:sz="4" w:color="7F7F7F"/></w:tblBorders></w:tblPr>`)
	sb.WriteString(`<w:tblGrid>`)
	for i := 0; i < ncol; i++ {
		sb.WriteString(`<w:gridCol w:w="` + strconv.Itoa(9000/ncol) + `"/>`)
	}
	sb.WriteString(`</w:tblGrid>`)
	cellPct := 5000 / ncol
	for ri, row := range rows {
		sb.WriteString(`<w:tr>`)
		for ci := 0; ci < ncol; ci++ {
			txt := ""
			if ci < len(row) {
				txt = row[ci]
			}
			sb.WriteString(`<w:tc><w:tcPr><w:tcW w:w="` + strconv.Itoa(cellPct) + `" w:type="pct"/>`)
			sb.WriteString(`<w:tcBorders>` + edge + `</w:tcBorders>`)
			if ri == 0 {
				sb.WriteString(`<w:shd w:val="clear" w:color="auto" w:fill="EFEFEF"/>`)
			}
			sb.WriteString(`<w:vAlign w:val="center"/></w:tcPr>`)
			sb.WriteString(paraXML(inlineRuns(mdText(txt), fontBody, szH1), paraOpts{line: 240, lineRule: "auto", noIndent: true}))
			sb.WriteString(`</w:tc>`)
		}
		sb.WriteString(`</w:tr>`)
	}
	sb.WriteString(`</w:tbl>`)
	return sb.String()
}

func isCheckHead(line string) bool {
	c := mdText(line)
	if strings.HasPrefix(c, "待确认清单") {
		return true
	}
	return strings.HasPrefix(c, "待确认") && len([]rune(c)) <= 12
}

func startsL1(line string) bool { return reL1.MatchString(mdText(line)) }

// bodyLineXML 单行正文 -> 段落 XML
func bodyLineXML(raw string, pageBreak bool) (string, bool) {
	t := strings.TrimSpace(raw)
	if t == "" {
		return "", false
	}
	level := 0
	if m := reHeadingLevel.FindStringSubmatch(t); m != nil {
		level = len(m[1])
	}
	contentPlain := mdText(reLeadingHash.ReplaceAllString(t, ""))
	if contentPlain == "" {
		return "", false
	}
	// 中文序号标题：一级黑体、二级楷体
	if reL1.MatchString(contentPlain) {
		return bodyPara(runXML(contentPlain, fontHei, szH1, false), pageBreak), true
	}
	if reL2.MatchString(contentPlain) {
		return bodyPara(runXML(contentPlain, fontKai, szH1, false), pageBreak), true
	}
	if reHR.MatchString(t) {
		return "", false
	}
	// markdown 标题：一级黑体、二级楷体、三级+仿宋
	if level > 0 {
		font := fontBody
		if level <= 1 {
			font = fontHei
		} else if level == 2 {
			font = fontKai
		}
		return bodyPara(runXML(contentPlain, font, szH1, false), pageBreak), true
	}
	if m := reBullet.FindStringSubmatch(t); m != nil {
		runs := runXML("• ", fontBody, szH1, false) + inlineRuns(mdText(m[2]), fontBody, szH1)
		return paraXML(runs, paraOpts{line: 560, lineRule: "exact", noIndent: true, pageBreak: pageBreak}), true
	}
	return bodyPara(inlineRuns(t, fontBody, szH1), pageBreak), true
}

func buildDocumentXML(md string) string {
	lines := strings.Split(strings.ReplaceAll(md, "\r\n", "\n"), "\n")
	for i := range lines {
		lines[i] = strings.TrimRight(lines[i], " \t")
	}
	// 文末“待确认清单”不写入 Word
	for i, l := range lines {
		if isCheckHead(l) {
			lines = lines[:i]
			break
		}
	}
	// 正文起点：首个“一、…”，之前视为封面
	bodyStart := len(lines)
	for i, l := range lines {
		if startsL1(l) {
			bodyStart = i
			break
		}
	}
	coverLines := []string{}
	for _, l := range lines[:bodyStart] {
		if s := mdText(l); s != "" {
			coverLines = append(coverLines, s)
		}
	}
	isCover := bodyStart < len(lines) && len(coverLines) >= 2 && len(coverLines) <= 12
	if isCover {
		head := coverLines
		if len(head) > 8 {
			head = head[:8]
		}
		if !reBookTitle.MatchString(strings.Join(head, "")) {
			isCover = false
		}
	}

	var body strings.Builder
	if isCover {
		ci := -1
		for i, l := range coverLines {
			if reBookTitle.MatchString(l) {
				ci = i
				break
			}
		}
		body.WriteString(coverPara("", szH1, fontBody, false, 0, 0))
		body.WriteString(coverPara("", szH1, fontBody, false, 0, 0))
		big := coverLines
		if ci >= 0 {
			big = coverLines[:ci]
		}
		for i, l := range big {
			before := 0
			if i == 0 {
				before = 200
			}
			body.WriteString(coverPara(l, szTitle, fontXBS, false, before, 240))
		}
		if ci >= 0 {
			body.WriteString(coverPara(coverLines[ci], szTitle, fontXBS, false, 160, 520))
			for _, l := range coverLines[ci+1:] {
				if strings.HasPrefix(l, "主办") || strings.HasPrefix(l, "承办") || strings.HasPrefix(l, "协办") {
					body.WriteString(coverPara(l, szH1, fontBody, true, 0, 120))
				} else {
					body.WriteString(coverPara(l, szNote, fontKai, false, 0, 120))
				}
			}
		} else {
			body.WriteString(coverPara("", szH1, fontBody, false, 0, 0))
		}
	}

	bodyLines := lines
	if isCover {
		bodyLines = lines[bodyStart:]
	}
	needBreak := isCover
	firstDone := false
	i := 0
	for i < len(bodyLines) {
		raw := bodyLines[i]
		t := strings.TrimSpace(raw)
		if t == "" {
			i++
			continue
		}
		// 连续表格行 -> 真实 Word 表格
		if strings.HasPrefix(t, "|") && strings.Contains(raw, "|") {
			rows := [][]string{}
			for i < len(bodyLines) {
				rt := strings.TrimSpace(bodyLines[i])
				if !strings.HasPrefix(rt, "|") {
					break
				}
				if !isTableSepRow(rt) {
					rows = append(rows, tableCells(rt))
				}
				i++
			}
			if len(rows) > 0 {
				if needBreak && !firstDone {
					body.WriteString(paraXML("", paraOpts{line: 560, lineRule: "exact", pageBreak: true, noIndent: true}))
				}
				body.WriteString(tableXML(rows))
				// 表格后补一个空段落，避免表格紧贴分节符
				body.WriteString(paraXML("", paraOpts{line: 560, lineRule: "exact", noIndent: true}))
				firstDone = true
				needBreak = false
			}
			continue
		}
		if p, ok := bodyLineXML(raw, needBreak && !firstDone); ok {
			body.WriteString(p)
			firstDone = true
			needBreak = false
		}
		i++
	}

	sect := `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>` +
		`<w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="851" w:footer="992" w:gutter="0"/>` +
		`<w:cols w:space="425" w:num="1"/><w:docGrid w:type="lines" w:linePitch="312"/></w:sectPr>`

	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` + "\n" +
		`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>` +
		body.String() + sect + `</w:body></w:document>`
}

const contentTypeXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`

const rootRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`

const docRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="仿宋" w:cs="仿宋"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="560" w:lineRule="exact"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`

// buildDocxBytes 生成 .docx 字节流
func buildDocxBytes(md string) ([]byte, error) {
	document := buildDocumentXML(md)
	buf := &bytes.Buffer{}
	zw := zip.NewWriter(buf)
	files := []struct{ name, content string }{
		{"[Content_Types].xml", contentTypeXML},
		{"_rels/.rels", rootRelsXML},
		{"word/_rels/document.xml.rels", docRelsXML},
		{"word/styles.xml", stylesXML},
		{"word/document.xml", document},
	}
	for _, f := range files {
		w, err := zw.Create(f.name)
		if err != nil {
			return nil, err
		}
		if _, err := w.Write([]byte(f.content)); err != nil {
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// extractDocxText 解析 .docx 提取纯文本
func extractDocxText(b []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(b), int64(len(b)))
	if err != nil {
		return "", fmt.Errorf("解析 Word 失败：%v", err)
	}
	var docXML string
	for _, f := range zr.File {
		if f.Name != "word/document.xml" {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return "", err
		}
		data, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return "", err
		}
		docXML = string(data)
		break
	}
	if docXML == "" {
		return "", fmt.Errorf("未能从 Word 文档中提取到文字（可能为空文档或非 .docx 格式）")
	}
	s := docXML
	s = strings.ReplaceAll(s, "</w:p>", "\n")
	s = strings.ReplaceAll(s, "<w:br/>", "\n")
	s = strings.ReplaceAll(s, "<w:tab/>", "\t")
	s = reAnyTag.ReplaceAllString(s, "")
	s = reZeroWidth.ReplaceAllString(s, "")
	s = html.UnescapeString(s)

	lines := strings.Split(s, "\n")
	for i := range lines {
		lines[i] = strings.TrimSpace(lines[i])
	}
	out := reBlankRuns.ReplaceAllString(strings.Join(lines, "\n"), "\n\n")
	out = strings.TrimSpace(out)
	if out == "" {
		return "", fmt.Errorf("未能从 Word 文档中提取到文字（可能为空文档）")
	}
	return out, nil
}
