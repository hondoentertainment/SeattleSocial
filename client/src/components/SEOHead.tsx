import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function SEOHead({
  title,
  description = 'Discover, connect, and experience the hottest events in Seattle.',
  ogImage = 'https://images.unsplash.com/photo-1502175353174-a7a70e73b4c3?w=1200',
  ogUrl,
  ogType = 'website',
}: SEOHeadProps) {
  const fullTitle = title ? `SeattleSocial | ${title}` : 'SeattleSocial | Discover the Best Events in Seattle';

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:type', ogType, 'property');
    if (ogUrl) {
      setMeta('og:url', ogUrl, 'property');
    }

    // Twitter card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);
  }, [fullTitle, description, ogImage, ogUrl, ogType]);

  return null;
}
