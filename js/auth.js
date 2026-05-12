const authReady = (async function () {
  const response = await fetch("/api/protected.php", {
    credentials: "include",
  });

  if (response.status === 401) {
    window.location.href = "/login.html";
    return null;
  }

  return response.json();
})();