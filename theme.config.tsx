import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span>*bitlab</span>,
  project: {
    link: "https://github.com/rainboowbee/nextra-app",
  },
  docsRepositoryBase: "https://github.com/rainboowbee/nextra-app",
  banner: {
    key: 'nextra-banner',
    text: '🎉 Добавлен материал по 5 заданию',
    dismissible: true,
  },
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
