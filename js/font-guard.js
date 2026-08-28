(function () {
  var root = document.documentElement;
  function ready() {
    root.classList.add('fonts-ready');
    root.classList.remove('fonts-loading');
  }
  root.classList.add('fonts-loading');
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTimeout(ready, 60);
    });
    setTimeout(ready, 2500);
  } else {
    ready();
  }
})();
