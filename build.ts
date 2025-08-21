import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const markdownDir = path.join(__dirname, 'markdown');
const outputDir = path.join(__dirname, 'dist/slides');
const indexPath = path.join(__dirname, 'dist/index.html');

// Create public directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// --- Build Slides ---
console.log('Building slides...');
const mdFiles = fs.readdirSync(markdownDir).filter(file => file.endsWith('.md'));

mdFiles.forEach(file => {
    const mdFilePath = path.join(markdownDir, file);
    const htmlFileName = file.replace('.md', '.html');
    const htmlFilePath = path.join(outputDir, htmlFileName);
    console.log(`Converting ${file} to ${htmlFileName}...`);
    try {
        execSync(`npx marp ${mdFilePath} -o ${htmlFilePath}`);

        // Read the generated HTML file
        let slideHtmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        // Back button HTML with initial hidden styles and ID
        const backButtonHtml = `
        <a id="backButton" href="../index.html" style="position: fixed; top: 20px; left: 20px; z-index: 1000; background-color: rgba(0,0,0,0.6); color: white; padding: 10px 15px; border-radius: 8px; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 16px; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); transition: opacity 0.3s ease; opacity: 0; pointer-events: none;">&larr; トップへ戻る</a>
        `;

        // JavaScript for dynamic visibility
        const visibilityScript = `
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const backButton = document.getElementById('backButton');
                let hideTimeout;

                function showButton() {
                    clearTimeout(hideTimeout);
                    if (backButton) {
                        backButton.style.opacity = '1';
                        backButton.style.pointerEvents = 'auto';
                    }
                    hideTimeout = setTimeout(hideButton, 2000); // Hide after 2 seconds
                }

                function hideButton() {
                    if (backButton) {
                        backButton.style.opacity = '0';
                        backButton.style.pointerEvents = 'none';
                    }
                }

                // Show button on interaction
                document.addEventListener('mousedown', showButton);
                document.addEventListener('mousemove', showButton);
                document.addEventListener('touchend', showButton);

                // Initial hide (in case of no immediate interaction)
                hideButton();
            });
        </script>
        `;
        
        const mermaidSetting = `
        <script type="module">
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: true });
            await mermaid.run({
                querySelector: '.language-mermaid'
            });
        </script>
        `

        // Inject the back button right after the <body> tag
        slideHtmlContent = slideHtmlContent.replace(/<body[^>]*>/, `<body>\n${backButtonHtml}\n${visibilityScript}\n${mermaidSetting}`);

        // Write the modified HTML back to the file
        fs.writeFileSync(htmlFilePath, slideHtmlContent);

    } catch (error) {
        console.error(`Error converting ${file}:`, error.stderr.toString());
    }
});
console.log('Slide build complete.');


// --- Generate Index Page ---
console.log('Generating index.html...');
const slideLinks = mdFiles.map(file => {
    const htmlFileName = file.replace('.md', '.html');
    const slideName = path.basename(file, '.md');
    return `<li><a href="slides/${htmlFileName}">${slideName}</a></li>`;
});

const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お勉強スライドまとめ</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-text: #1c1c1e;
            --secondary-text: #6a6a6a;
            --background-color: #f5f5f7; /* Lighter background */
            --card-background: #ffffff;
            --border-color: #e8e8ed;
            --accent-color: #007aff; /* Apple Blue */
            --hover-background: #f0f0f5; /* Subtle hover background */
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            background-color: var(--background-color);
            color: var(--primary-text);
            margin: 0;
            padding: 40px 20px; /* More padding */
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            box-sizing: border-box;
            line-height: 1.6;
        }
        .container {
            background-color: var(--card-background);
            border-radius: 16px; /* Slightly more rounded */
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); /* More pronounced shadow */
            padding: 50px; /* More padding inside */
            max-width: 760px; /* Wider container */
            width: 100%;
            box-sizing: border-box;
            border: 1px solid var(--border-color); /* Subtle border */
        }
        h1 {
            font-size: 3em; /* Larger title */
            font-weight: 700; /* Bolder title */
            color: var(--primary-text);
            text-align: center;
            margin-bottom: 20px;
            letter-spacing: -0.03em; /* Tighter letter spacing */
        }
        .subtitle {
            font-size: 1.1em;
            color: var(--secondary-text);
            text-align: center;
            margin-bottom: 50px;
            font-weight: 400;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        li {
            margin-bottom: 0; /* Remove margin-bottom from li */
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.3s ease; /* Smooth background transition */
        }
        li:last-child {
            border-bottom: none;
        }
        li:hover {
            background-color: var(--hover-background);
        }
        a {
            font-size: 1.4em; /* Slightly larger link text */
            color: var(--accent-color);
            text-decoration: none;
            display: block;
            padding: 20px 25px; /* More padding for links */
            transition: color 0.3s ease, transform 0.3s ease;
            font-weight: 500; /* Medium weight for links */
        }
        a:hover {
            color: var(--primary-text);
            transform: translateX(8px); /* More pronounced slide effect */
        }
        /* Responsive adjustments */
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            .container {
                padding: 30px;
                border-radius: 12px;
            }
            h1 {
                font-size: 2.2em;
                margin-bottom: 15px;
            }
            .subtitle {
                font-size: 1em;
                margin-bottom: 30px;
            }
            a {
                font-size: 1.2em;
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>お勉強スライドまとめ</h1>
        <p class="subtitle">学習を始めるトピックを選択してください。</p>
        <ul>
            ${slideLinks.join('\n')}
        </ul>
    </div>
</body>
</html>
`;

fs.writeFileSync(indexPath, htmlContent);
console.log('index.html generated successfully.');