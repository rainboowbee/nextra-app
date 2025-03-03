import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span>*bitlab</span>,
  project: {
    link: "https://github.com/yourusername/informatika-ege-oge",
  },
  chat: {
    link: "https://t.me/rainboowbee",
  },
  docsRepositoryBase: "https://github.com/yourusername/informatika-ege-oge",
  footer: {
    text: "bitlab © 2025",
  },
  head: (
    <>
      <meta
        name="description"
        content="Материалы для подготовки к ЕГЭ и ОГЭ по информатике"
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Информатика ЕГЭ/ОГЭ" />
      <meta
        property="og:description"
        content="Материалы для подготовки к ЕГЭ и ОГЭ по информатике"
      />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: "%s – Информатика ЕГЭ/ОГЭ",
    };
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === "separator") {
        return <span className="cursor-default">{title}</span>;
      }
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    title: "Содержание",
  },
  navigation: {
    prev: true,
    next: true,
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: "system",
  },
};

export default config;
