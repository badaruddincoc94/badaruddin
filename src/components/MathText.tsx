import React from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
  asBlock?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ content, className = '', asBlock = false }) => {
  if (!content) return null;

  // Split text by $$...$$ (display math) and $...$ (inline math)
  // Also clean up common mathematical representations
  const renderFormattedText = (raw: string) => {
    // If string has $ or mathematical expressions
    const parts = raw.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathExpr = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, { displayMode: true, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2 block overflow-x-auto text-emerald-800" />;
        } catch {
          return <span key={index} className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">{mathExpr}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const mathExpr = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(mathExpr, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-math text-emerald-900 font-medium" />;
        } catch {
          return <span key={index} className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700">{mathExpr}</span>;
        }
      } else {
        // Format common unicode math symbols and superscripts nicely
        return <span key={index}>{part}</span>;
      }
    });
  };

  if (asBlock) {
    return <div className={`leading-relaxed ${className}`}>{renderFormattedText(content)}</div>;
  }

  return <span className={className}>{renderFormattedText(content)}</span>;
};
