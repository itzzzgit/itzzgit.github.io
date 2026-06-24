(function () {
  // ── Contraseña de acceso ──────────────────────────────────────────────────
  var ADMIN_PASSWORD = "xv2026paola";

  // ── Elementos UI ─────────────────────────────────────────────────────────
  var loginScreen   = document.getElementById("loginScreen");
  var adminPanel    = document.getElementById("adminPanel");
  var loginForm     = document.getElementById("loginForm");
  var passwordInput = document.getElementById("passwordInput");
  var loginError    = document.getElementById("loginError");
  var logoutBtn     = document.getElementById("logoutBtn");

  var totalCount  = document.getElementById("totalCount");
  var acceptCount = document.getElementById("acceptCount");
  var rejectCount = document.getElementById("rejectCount");
  var tableBody   = document.getElementById("responsesTableBody");
  var adminStatus = document.getElementById("adminStatus");
  var refreshBtn  = document.getElementById("refreshBtn");
  var exportBtn   = document.getElementById("exportBtn");

  var cachedRows = [];

  // ── Login ─────────────────────────────────────────────────────────────────
  function showPanel() {
    loginScreen.hidden = true;
    adminPanel.hidden  = false;
    loadResponses();
  }

  function showLogin() {
    loginScreen.hidden = false;
    adminPanel.hidden  = true;
    passwordInput.value = "";
  }

  // Verificar sesión guardada
  if (sessionStorage.getItem("admin_auth") === "1") {
    showPanel();
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (passwordInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "1");
      loginError.textContent = "";
      showPanel();
    } else {
      loginError.textContent = "Contraseña incorrecta.";
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("admin_auth");
    showLogin();
  });

  // ── Supabase ──────────────────────────────────────────────────────────────
  var cfg = window.APP_CONFIG || {};
  var supabaseUrl     = cfg.supabaseUrl;
  var supabaseAnonKey = cfg.supabaseAnonKey;

  if (!supabaseUrl || supabaseUrl.includes("TU-PROYECTO")) {
    setStatus("Falta configurar Supabase en js/config.js", true);
    return;
  }

  var supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setStatus(msg, isError) {
    adminStatus.textContent  = msg;
    adminStatus.style.color  = isError ? "#c0392b" : "#888";
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  function formatFull(iso) {
    return formatDate(iso) + " " + formatTime(iso);
  }

  // ── Tabla ─────────────────────────────────────────────────────────────────
  function drawTable(rows) {
    tableBody.innerHTML = "";

    if (!rows.length) {
      var empty = document.createElement("tr");
      empty.innerHTML = '<td colspan="7" style="text-align:center;padding:28px;color:#aaa">Sin respuestas todavía.</td>';
      tableBody.appendChild(empty);
      return;
    }

    rows.forEach(function (row, i) {
      var isAccepted = row.response === "accepted";
      var tr = document.createElement("tr");
      tr.dataset.id = row.id;
      tr.innerHTML =
        "<td>" + (i + 1) + "</td>" +
        "<td>" + escHtml(row.full_name || "") + "</td>" +
        "<td><span class='badge " + (isAccepted ? "badge-accept" : "badge-reject") + "'>" +
          (isAccepted ? "✓ Confirma" : "✗ No asistirá") +
        "</span></td>" +
        "<td>" + escHtml(row.notes || "") + "</td>" +
        "<td>" + formatDate(row.created_at) + "</td>" +
        "<td>" + formatTime(row.created_at) + "</td>" +
        "<td><button class='btn-delete' data-id='" + row.id + "' title='Eliminar'>🗑</button></td>";
      tableBody.appendChild(tr);
    });
  }

  function drawCounters(rows) {
    var accepted = rows.filter(function (r) { return r.response === "accepted"; }).length;
    var rejected = rows.filter(function (r) { return r.response === "rejected"; }).length;
    totalCount.textContent  = rows.length;
    acceptCount.textContent = accepted;
    rejectCount.textContent = rejected;
  }

  // ── Excel con dos hojas ───────────────────────────────────────────────────
  function exportToExcel() {
    if (!cachedRows.length) {
      setStatus("No hay datos para exportar.", true);
      return;
    }

    function toRow(r) {
      return {
        "Nombre":    r.full_name || "",
        "Respuesta": r.response === "accepted" ? "Confirma asistencia" : "No asistirá",
        "Mensaje":   r.notes || "",
        "Fecha":     formatDate(r.created_at),
        "Hora":      formatTime(r.created_at)
      };
    }

    var confirmed = cachedRows.filter(function (r) { return r.response === "accepted"; });
    var rejected  = cachedRows.filter(function (r) { return r.response === "rejected"; });

    var wb = XLSX.utils.book_new();

    var wsConfirmed = XLSX.utils.json_to_sheet(confirmed.length ? confirmed.map(toRow) : [{ "Nombre": "Sin confirmados aún" }]);
    XLSX.utils.book_append_sheet(wb, wsConfirmed, "Confirmados");

    var wsRejected = XLSX.utils.json_to_sheet(rejected.length ? rejected.map(toRow) : [{ "Nombre": "Sin rechazados aún" }]);
    XLSX.utils.book_append_sheet(wb, wsRejected, "No asistirán");

    XLSX.writeFile(wb, "respuestas_xv_paola.xlsx");
    setStatus("Excel generado: 2 hojas (" + confirmed.length + " confirmados, " + rejected.length + " no asistirán).");
  }

  // ── Cargar datos ──────────────────────────────────────────────────────────
  async function loadResponses() {
    refreshBtn.disabled = true;
    exportBtn.disabled  = true;
    setStatus("Cargando respuestas...");

    var result = await supabaseClient
      .from("xv_preinvitation_responses")
      .select("id, full_name, response, notes, created_at")
      .order("created_at", { ascending: false });

    if (result.error) {
      setStatus("No se pudieron cargar las respuestas.", true);
      refreshBtn.disabled = false;
      exportBtn.disabled  = false;
      return;
    }

    cachedRows = result.data || [];
    drawCounters(cachedRows);
    drawTable(cachedRows);
    setStatus("Última actualización: " + new Date().toLocaleTimeString("es-MX") + " · " + cachedRows.length + " respuesta(s).");
    refreshBtn.disabled = false;
    exportBtn.disabled  = false;
  }

  refreshBtn.addEventListener("click", loadResponses);
  exportBtn.addEventListener("click", exportToExcel);

  // ── Eliminar registro ─────────────────────────────────────────────────────
  tableBody.addEventListener("click", async function (e) {
    var btn = e.target.closest(".btn-delete");
    if (!btn) return;

    var id = btn.dataset.id;
    var tr = tableBody.querySelector("tr[data-id='" + id + "']");
    var nombre = tr ? tr.cells[1].textContent : "este registro";

    if (!confirm("¿Eliminar a " + nombre + "? Esta acción no se puede deshacer.")) return;

    btn.disabled = true;
    btn.textContent = "…";

    var result = await supabaseClient
      .from("xv_preinvitation_responses")
      .delete()
      .eq("id", id);

    if (result.error) {
      setStatus("No se pudo eliminar el registro.", true);
      btn.disabled = false;
      btn.textContent = "🗑";
      return;
    }

    cachedRows = cachedRows.filter(function (r) { return String(r.id) !== String(id); });
    drawCounters(cachedRows);
    drawTable(cachedRows);
    setStatus("Registro eliminado correctamente.");
  });
})();
