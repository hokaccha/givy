import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  fontFamily: "inherit",
});

let idCounter = 0;

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${idCounter++}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const { svg } = await mermaid.render(idRef.current, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Fix edge label clipping: mermaid's foreignObject elements
          // can be too narrow for their text content
          const svgEl =
            containerRef.current.querySelector<SVGSVGElement>("svg");
          if (svgEl) {
            svgEl.style.overflow = "visible";
            for (const fo of svgEl.querySelectorAll<SVGForeignObjectElement>(
              ".edgeLabel foreignObject",
            )) {
              fo.style.overflow = "visible";
            }
          }
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="bg-red-50 text-red-700 p-4 rounded-md text-sm overflow-auto">
        <code>{code}</code>
      </pre>
    );
  }

  return <div ref={containerRef} className="flex justify-center py-4" />;
}
