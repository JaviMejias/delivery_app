css_path = 'app/frontend/entrypoints/application.css'
css_content = File.read(css_path)

theme_block = <<-EOF
@theme {
  --color-primary-50: var(--sf-primary-50);
  --color-primary-100: var(--sf-primary-100);
  --color-primary-200: var(--sf-primary-200);
  --color-primary-300: var(--sf-primary-300);
  --color-primary-400: var(--sf-primary-400);
  --color-primary-500: var(--sf-primary-500);
  --color-primary-600: var(--sf-primary-600);
  --color-primary-700: var(--sf-primary-700);
  --color-primary-800: var(--sf-primary-800);
  --color-primary-900: var(--sf-primary-900);
  --color-primary-950: var(--sf-primary-950);
}

:root {
  --sf-primary-50: var(--color-indigo-50);
  --sf-primary-100: var(--color-indigo-100);
  --sf-primary-200: var(--color-indigo-200);
  --sf-primary-300: var(--color-indigo-300);
  --sf-primary-400: var(--color-indigo-400);
  --sf-primary-500: var(--color-indigo-500);
  --sf-primary-600: var(--color-indigo-600);
  --sf-primary-700: var(--color-indigo-700);
  --sf-primary-800: var(--color-indigo-800);
  --sf-primary-900: var(--color-indigo-900);
  --sf-primary-950: var(--color-indigo-950);
}

.aura-red {
  --sf-primary-50: var(--color-red-50);
  --sf-primary-100: var(--color-red-100);
  --sf-primary-200: var(--color-red-200);
  --sf-primary-300: var(--color-red-300);
  --sf-primary-400: var(--color-red-400);
  --sf-primary-500: var(--color-red-500);
  --sf-primary-600: var(--color-red-600);
  --sf-primary-700: var(--color-red-700);
  --sf-primary-800: var(--color-red-800);
  --sf-primary-900: var(--color-red-900);
  --sf-primary-950: var(--color-red-950);
}

.aura-blue {
  --sf-primary-50: var(--color-blue-50);
  --sf-primary-100: var(--color-blue-100);
  --sf-primary-200: var(--color-blue-200);
  --sf-primary-300: var(--color-blue-300);
  --sf-primary-400: var(--color-blue-400);
  --sf-primary-500: var(--color-blue-500);
  --sf-primary-600: var(--color-blue-600);
  --sf-primary-700: var(--color-blue-700);
  --sf-primary-800: var(--color-blue-800);
  --sf-primary-900: var(--color-blue-900);
  --sf-primary-950: var(--color-blue-950);
}

.aura-amber {
  --sf-primary-50: var(--color-amber-50);
  --sf-primary-100: var(--color-amber-100);
  --sf-primary-200: var(--color-amber-200);
  --sf-primary-300: var(--color-amber-300);
  --sf-primary-400: var(--color-amber-400);
  --sf-primary-500: var(--color-amber-500);
  --sf-primary-600: var(--color-amber-600);
  --sf-primary-700: var(--color-amber-700);
  --sf-primary-800: var(--color-amber-800);
  --sf-primary-900: var(--color-amber-900);
  --sf-primary-950: var(--color-amber-950);
}

.aura-orange {
  --sf-primary-50: var(--color-orange-50);
  --sf-primary-100: var(--color-orange-100);
  --sf-primary-200: var(--color-orange-200);
  --sf-primary-300: var(--color-orange-300);
  --sf-primary-400: var(--color-orange-400);
  --sf-primary-500: var(--color-orange-500);
  --sf-primary-600: var(--color-orange-600);
  --sf-primary-700: var(--color-orange-700);
  --sf-primary-800: var(--color-orange-800);
  --sf-primary-900: var(--color-orange-900);
  --sf-primary-950: var(--color-orange-950);
}
EOF

# Replace original core colors definition so it references the new variables
if css_content.include?("--sf-primary: #6366f1;")
  css_content = css_content.gsub("--sf-primary: #6366f1;", "--sf-primary: var(--sf-primary-500);")
  css_content = css_content.gsub("--sf-primary-hover: #4f46e5;", "--sf-primary-hover: var(--sf-primary-600);")
end

if !css_content.include?("@theme")
  css_content = css_content.gsub('@import "tailwindcss";', %Q{@import "tailwindcss";\n\n#{theme_block}})
end

# Update pulseGlow animation to use var(--sf-primary-500)
css_content = css_content.gsub('rgba(99, 102, 241, 0.1)', 'color-mix(in srgb, var(--sf-primary-500) 10%, transparent)')
css_content = css_content.gsub('rgba(99, 102, 241, 0.3)', 'color-mix(in srgb, var(--sf-primary-500) 30%, transparent)')
css_content = css_content.gsub('rgba(99, 102, 241, 0.05)', 'color-mix(in srgb, var(--sf-primary-500) 5%, transparent)')

File.write(css_path, css_content)
