import React from 'react';

interface CustomCodeInjectorProps {
  customCss?: string | null;
  customJs?: string | null;
  customHtml?: string | null;
}

export function CustomCodeInjector({ customCss, customJs, customHtml }: CustomCodeInjectorProps) {
  return (
    <>
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
      
      {customHtml && (
        <div 
          dangerouslySetInnerHTML={{ __html: customHtml }} 
          style={{ display: 'none' }} // Hidden by default unless they use absolute positioning
        />
      )}

      {customJs && (
        <script dangerouslySetInnerHTML={{ __html: customJs }} />
      )}
    </>
  );
}
