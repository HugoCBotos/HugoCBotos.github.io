(() => {
  function revealLinkedProof() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    const proof = target.closest('details');
    if (proof) proof.open = true;
  }
  addEventListener('hashchange', revealLinkedProof);
  revealLinkedProof();
  document.querySelectorAll('details.proof-block').forEach(proof => {
    proof.addEventListener('toggle', () => {
      if (proof.open && window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([proof]).catch(console.error);
      }
    });
  });
  let openedForPrint = [];
  addEventListener('beforeprint', () => {
    openedForPrint = [...document.querySelectorAll('details:not([open])')];
    openedForPrint.forEach(proof => { proof.open = true; });
  });
  addEventListener('afterprint', () => {
    openedForPrint.forEach(proof => { proof.open = false; });
  });
})();
