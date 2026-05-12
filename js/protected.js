window.addEventListener("load", async function () {
  const user = await requireAuth();
  if (!user) return; // requireAuth already redirected

  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("userId").textContent = user.user_id;
});