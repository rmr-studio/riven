export function scrollToSection(sectionId: string, href?: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    window.history.replaceState(null, '', href ?? `/#${sectionId}`);
  } else {
    // On a different route — navigate to the home page with the hash
    window.location.href = href ?? `/#${sectionId}`;
  }
}
