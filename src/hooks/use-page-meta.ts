import { useEffect } from "react";

const CANONICAL_BASE = "https://obyo.io";

const HOME_DEFAULTS = {
  title: "Obyo Option — İkili Opsiyon Trading",
  description:
    "Obyo Option — Forex ve OTC varlıklarla profesyonel ikili opsiyon trading platformu.",
  ogTitle: "Obyo Option — İkili Opsiyon Trading",
  ogDescription:
    "Forex ve OTC varlıklarla profesyonel ikili opsiyon trading platformu.",
  twitterTitle: "Obyo Option",
  twitterDescription: "Profesyonel ikili opsiyon trading platformu.",
  canonical: CANONICAL_BASE + "/",
  ogUrl: CANONICAL_BASE + "/",
};

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(
    `meta[${attr}="${key}"]`,
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    document.title = meta.title;
    setCanonical(meta.canonical);
    setMeta("name", "description", meta.description);
    setMeta("property", "og:url", meta.canonical);
    setMeta("property", "og:title", meta.ogTitle ?? meta.title);
    setMeta("property", "og:description", meta.ogDescription ?? meta.description);
    setMeta("name", "twitter:title", meta.twitterTitle ?? meta.title);
    setMeta("name", "twitter:description", meta.twitterDescription ?? meta.description);

    return () => {
      document.title = HOME_DEFAULTS.title;
      setCanonical(HOME_DEFAULTS.canonical);
      setMeta("name", "description", HOME_DEFAULTS.description);
      setMeta("property", "og:url", HOME_DEFAULTS.ogUrl);
      setMeta("property", "og:title", HOME_DEFAULTS.ogTitle);
      setMeta("property", "og:description", HOME_DEFAULTS.ogDescription);
      setMeta("name", "twitter:title", HOME_DEFAULTS.twitterTitle);
      setMeta("name", "twitter:description", HOME_DEFAULTS.twitterDescription);
    };
  }, [
    meta.title,
    meta.description,
    meta.canonical,
    meta.ogTitle,
    meta.ogDescription,
    meta.twitterTitle,
    meta.twitterDescription,
  ]);
}

export { CANONICAL_BASE };
