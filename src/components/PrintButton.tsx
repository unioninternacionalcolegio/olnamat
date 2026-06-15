// components/PrintButton.tsx
"use client"

export default function PrintButton({ targetId, title }: { targetId: string, title: string }) {
    const handlePrint = () => {
        const content = document.getElementById(targetId);
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Extraemos los estilos de Tailwind para que el PDF se vea igual que en la web
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(style => style.outerHTML)
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir PDF - ${title}</title>
                    ${styles}
                </head>
                <body class="p-8 bg-white">
                    <div class="mb-6 border-b pb-4">
                        <h1 class="text-2xl font-black text-blue-800">Lista de Inscritos</h1>
                        <h2 class="text-lg font-bold text-gray-600">${title}</h2>
                    </div>
                    ${content.innerHTML}
                    <script>
                        // Damos un pequeño margen de tiempo para que carguen los estilos
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 300);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full transition-colors border border-gray-300"
            title="Imprimir tabla en PDF"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir PDF
        </button>
    );
}