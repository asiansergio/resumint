# ResuMint

A tool for developers who maintain multilingual resumes and endlessly tweak, refine, and over-engineer them.
Forget clunky Word docs, endless formatting battles, and PDF struggles.
For devs who avoid Adobe and won't touch Canva, ResuMint takes your structured JSON, applies HTML/CSS templates, and outputs polished, multilingual PDF resumes — all with a single command.
It even spell-checks your content, so no more embarrassing mistakes.

Because your CV should evolve as fast as you do.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/resumeforge.git
cd resumeforge

# Install dependencies
npm install

# If you have chrome installed you may skip this step
npx puppeteer browsers install chrome

# Run the tool
node main.js [options]
```

## Quick Start

```bash
# Try the demo with example data
npm run demo

# Command to run directly with example data
node main.js -d ./data/example-data.json
```

## Usage

```bash
node main.js [options]
```

### Options

- `--data, -d`: Path to the resume data JSON file (default: ./data/resume-data.json)
- `--template, -t`: Template name to use (default: from metadata or "default")
- `--language, -l`: Generate resume for specific language only
- `--output, -o`: Output directory for the generated files (default: ./output)
- `--html`: Save HTML files along with PDFs
- `--htmlOnly`: Generate only HTML files, not PDFs
- `--templatesDir`: Directory containing templates (default: ./templates)

### Examples

```bash
# Generate resumes from a specific JSON file
node main.js --data ./my-resume.json

# Generate resume only for English
node main.js --language en

# Use a specific template
node main.js --template fancy

# Save both HTML and PDF to custom directory
node main.js --html --output ./my-resumes
```

## Data Structure

ResumeForge uses a JSON file to store your resume data. See [data/example-data.json](data/example-data.json) for a complete example with multilingual support.

## Templates

The default template is included. To create custom templates:

1. Create a new HTML file in the `templates` directory
2. Name it `[your-template-name]-template.html`
3. Use Handlebars syntax for templating

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE).
