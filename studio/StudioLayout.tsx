import React from 'react'

/**
 * StudioLayout — minimal wrapper for Sanity Studio
 * - Applies clean Inter font
 * - Keeps Sanity's default UI (dark theme works fine)
 * - Focuses on workflow clarity via field descriptions
 */
export function StudioLayout({renderDefault, ...props}: any) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        body, body * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
      `}</style>
      {renderDefault(props)}
    </>
  )
}
