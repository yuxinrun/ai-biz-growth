<?xml version="1.0" encoding="UTF-8"?>
<!-- ==========================================================================
     sitemap.xml 的浏览视图。
     作用：浏览器直接打开 sitemap.xml 时，按这份 XSL 把它渲染成可读表格；
     搜索引擎不读 XSL，只读 XML 本身，两者互不影响。
     说明：部分浏览器在 file:// 协议下会出于安全策略忽略 XSL，此时显示的
     仍是 XML 源码，属正常现象。人类可读的版本请打开 sitemap.html。
     ========================================================================== -->
<xsl:stylesheet version="1.0"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  exclude-result-prefixes="sm">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>站点地图（XML）· AI经营增长指南</title>
        <style>
          :root {
            --navy: #142D4E; --blue: #3478F6; --amber: #FFB547;
            --bg: #F7F9FC; --card: #FFFFFF; --text: #263445; --muted: #778397; --line: #E3E9F2;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0; padding: 0 20px 56px; background: var(--bg); color: var(--text);
            font: 15px/1.7 "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", system-ui, sans-serif;
          }
          .wrap { max-width: 980px; margin: 0 auto; }
          header { padding: 40px 0 8px; }
          .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--navy); font-weight: 800; }
          .brand i { width: 30px; height: 30px; border-radius: 9px; background: var(--navy); color: var(--amber); display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 16px; }
          h1 { font-size: clamp(1.5rem, 3.2vw, 2.1rem); color: var(--navy); margin: 26px 0 8px; letter-spacing: -.02em; }
          .lede { color: var(--muted); margin: 0 0 6px; }
          .lede a { color: var(--blue); }
          .meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 26px; }
          .badge { display: inline-block; padding: 3px 11px; border-radius: 999px; background: #EAF1FE; color: var(--blue); font-size: .78rem; font-weight: 700; }
          .badge.amber { background: #FFF3E0; color: #B26A00; }
          .badge.gray { background: #EEF2F7; color: var(--muted); }
          .table-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
          table { width: 100%; border-collapse: collapse; font-size: .9rem; }
          th, td { text-align: left; padding: 11px 16px; border-bottom: 1px solid var(--line); vertical-align: top; }
          th { background: #F2F6FC; color: var(--navy); font-size: .8rem; letter-spacing: .02em; }
          tr:last-child td { border-bottom: 0; }
          td:first-child { color: var(--muted); width: 52px; }
          td.url { font-family: ui-monospace, Consolas, "Courier New", monospace; font-size: .82rem; word-break: break-all; }
          .num { color: var(--muted); font-variant-numeric: tabular-nums; }
          .note { margin-top: 22px; padding: 16px 18px; background: #FFF8E8; border: 1px solid #F3E1B8; border-radius: 12px; font-size: .86rem; color: #7A5A16; }
          .note strong { color: #5F4508; }
          footer { margin-top: 26px; color: var(--muted); font-size: .8rem; }
          footer a { color: var(--blue); }
          @media (max-width: 640px) {
            th, td { padding: 9px 11px; }
            th:nth-child(3), td:nth-child(3) { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <a class="brand" href="index.html"><i>✦</i>AI经营增长指南</a>
            <h1>站点地图（XML）</h1>
            <p class="lede">这是提交给搜索引擎的标准站点地图。人类可读的版本请打开 <a href="sitemap.html">sitemap.html</a>。</p>
            <div class="meta">
              <span class="badge"><xsl:value-of select="count(sm:urlset/sm:url)"/> 条 URL</span>
              <span class="badge amber">sitemaps.org 0.9</span>
              <span class="badge gray">UTF-8</span>
            </div>
          </header>

          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">URL</th>
                  <th scope="col">更新频率</th>
                  <th scope="col">优先级</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:urlset/sm:url">
                  <tr>
                    <td class="num"><xsl:value-of select="position()"/></td>
                    <td class="url"><xsl:value-of select="sm:loc"/></td>
                    <td><xsl:choose><xsl:when test="sm:changefreq"><xsl:value-of select="sm:changefreq"/></xsl:when><xsl:otherwise>—</xsl:otherwise></xsl:choose></td>
                    <td class="num"><xsl:choose><xsl:when test="sm:priority"><xsl:value-of select="sm:priority"/></xsl:when><xsl:otherwise>—</xsl:otherwise></xsl:choose></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="note">
            <strong>看到源码而不是这张表格？</strong>
            说明当前浏览器没有应用 XSL 样式（常见于 <code>file://</code> 直接双击打开的场景）。这不影响搜索引擎抓取，也不代表文件损坏；本站的图形版站点地图见 <a href="sitemap.html">sitemap.html</a>。
          </div>

          <footer>
            <p>© 2026 AI经营增长指南 · AI Biz Growth · <a href="index.html">返回首页</a></p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>