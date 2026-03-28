/**
 * Lightweight markdown renderer for authored guide content.
 * Handles: headings (##, ###), paragraphs, bold, italic, inline code,
 * unordered lists, ordered lists, and horizontal rules.
 * No external dependencies. Content is author-controlled so inline HTML is safe.
 */

function parseInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function renderBlock(block: string, index: number): React.ReactNode {
  // H2
  if (block.startsWith("## ")) {
    return (
      <h2
        key={index}
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 22,
          fontWeight: 400,
          color: "#0f1623",
          marginTop: 40,
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}
        dangerouslySetInnerHTML={{ __html: parseInline(block.slice(3)) }}
      />
    );
  }

  // H3
  if (block.startsWith("### ")) {
    return (
      <h3
        key={index}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          fontWeight: 600,
          color: "#0f1623",
          marginTop: 28,
          marginBottom: 8,
        }}
        dangerouslySetInnerHTML={{ __html: parseInline(block.slice(4)) }}
      />
    );
  }

  // H1 (rarely used in body, but handle it)
  if (block.startsWith("# ")) {
    return (
      <h1
        key={index}
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 28,
          fontWeight: 400,
          color: "#0f1623",
          marginTop: 0,
          marginBottom: 16,
          letterSpacing: "-0.02em",
        }}
        dangerouslySetInnerHTML={{ __html: parseInline(block.slice(2)) }}
      />
    );
  }

  // Horizontal rule
  if (block === "---") {
    return (
      <hr
        key={index}
        style={{ border: "none", borderTop: "1px solid #e5e2db", margin: "32px 0" }}
      />
    );
  }

  const lines = block.split("\n");

  // Table (lines starting and ending with |, second line is separator)
  const isTable =
    lines.length >= 2 &&
    lines.every((l) => l.trim().startsWith("|") && l.trim().endsWith("|")) &&
    /^\|[-:\s|]+\|$/.test(lines[1].trim());
  if (isTable) {
    const [headerRow, , ...dataRows] = lines;
    const headers = headerRow.split("|").slice(1, -1).map((h) => h.trim());
    const rows = dataRows
      .filter((r) => r.trim())
      .map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
    return (
      <div key={index} style={{ overflowX: "auto", margin: "20px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "#f7f5f0",
                    borderBottom: "2px solid #e5e2db",
                    color: "#0f1623",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                  dangerouslySetInnerHTML={{ __html: parseInline(h) }}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #e5e2db" }}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "10px 14px",
                      color: "#374151",
                      verticalAlign: "top",
                    }}
                    dangerouslySetInnerHTML={{ __html: parseInline(cell) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Unordered list
  const isUL = lines.every((l) => l.startsWith("- ") || l.startsWith("* "));
  if (isUL) {
    return (
      <ul
        key={index}
        style={{
          paddingLeft: 20,
          margin: "12px 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {lines.map((l, j) => (
          <li
            key={j}
            style={{
              fontSize: 15,
              color: "#374151",
              lineHeight: 1.65,
              fontFamily: "var(--font-sans)",
            }}
            dangerouslySetInnerHTML={{ __html: parseInline(l.replace(/^[-*] /, "")) }}
          />
        ))}
      </ul>
    );
  }

  // Ordered list
  const isOL = lines.every((l) => /^\d+\. /.test(l));
  if (isOL) {
    return (
      <ol
        key={index}
        style={{
          paddingLeft: 20,
          margin: "12px 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {lines.map((l, j) => (
          <li
            key={j}
            style={{
              fontSize: 15,
              color: "#374151",
              lineHeight: 1.65,
              fontFamily: "var(--font-sans)",
            }}
            dangerouslySetInnerHTML={{ __html: parseInline(l.replace(/^\d+\. /, "")) }}
          />
        ))}
      </ol>
    );
  }

  // Default: paragraph
  return (
    <p
      key={index}
      style={{
        fontSize: 15,
        color: "#374151",
        lineHeight: 1.75,
        margin: "12px 0",
        fontFamily: "var(--font-sans)",
      }}
      dangerouslySetInnerHTML={{ __html: parseInline(block.replace(/\n/g, " ")) }}
    />
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = content
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return <div>{blocks.map((block, i) => renderBlock(block, i))}</div>;
}
