#!/bin/bash
# =============================================================================
# download-logos.sh — Descarga logos oficiales de organizadores SEMS
# Uso: cd ~/Desktop/sems_ui && bash download-logos.sh
# =============================================================================

DEST="public/images/logos"
mkdir -p "$DEST"

echo "========================================================"
echo "  Descargando logos de organizadores SEMS"
echo "========================================================"
echo ""

# Función de descarga con fallback
download_logo() {
  local FILE="$1"
  local URL1="$2"
  local URL2="$3"
  local NAME="$4"

  echo -n "  📥 $NAME... "
  if curl -sL --max-time 15 "$URL1" -o "$DEST/$FILE" && [ -s "$DEST/$FILE" ]; then
    echo "✅ ($(du -h "$DEST/$FILE" | cut -f1))"
  elif [ -n "$URL2" ] && curl -sL --max-time 15 "$URL2" -o "$DEST/$FILE" && [ -s "$DEST/$FILE" ]; then
    echo "✅ fallback ($(du -h "$DEST/$FILE" | cut -f1))"
  else
    echo "⚠️  no disponible — se usará placeholder"
    rm -f "$DEST/$FILE"
  fi
}

# ── UMAYOR — Institución Universitaria Mayor de Cartagena ─────────────────────
download_logo "logo-umayor.png" \
  "https://umayor.edu.co/wp-content/uploads/2024/01/logo-umayor-color.png" \
  "https://umayor.edu.co/wp-content/uploads/2021/04/logo-umayor.png" \
  "UMAYOR (Cartagena)"

# ── UTE — Universidad UTE Ecuador ─────────────────────────────────────────────
download_logo "logo-ute.png" \
  "https://www.ute.edu.ec/wp-content/uploads/2022/01/logo-ute.png" \
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/UTE_Logo.png/320px-UTE_Logo.png" \
  "Universidad UTE"

# ── UEB — Universidad Estatal de Bolívar ──────────────────────────────────────
download_logo "logo-ueb.png" \
  "https://www.ueb.edu.ec/images/logo_ueb.png" \
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/UEB_Logo.png/320px-UEB_Logo.png" \
  "Universidad Estatal de Bolívar"

# ── UTA — Universidad Técnica de Ambato ───────────────────────────────────────
download_logo "logo-uta.png" \
  "https://www.uta.edu.ec/v3.2/uta/images/logos/logo-uta.png" \
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/UTA-logo.png/280px-UTA-logo.png" \
  "Universidad Técnica de Ambato"

# ── UPSE — Universidad Estatal Península de Santa Elena ───────────────────────
download_logo "logo-upse.png" \
  "https://www.upse.edu.ec/index.php/images/logo-upse.png" \
  "https://upload.wikimedia.org/wikipedia/commons/4/49/Logo_UPSE.png" \
  "UPSE"

# ── UINL — Universidad Internacional Nueva Luz ────────────────────────────────
download_logo "logo-uinl.png" \
  "https://uinl.edu.ec/wp-content/uploads/logo-uinl.png" \
  "https://uinl.edu.ec/images/logo.png" \
  "Universidad Internacional Nueva Luz"

# ── FENAPE — Federación Nacional de Periodistas del Ecuador ───────────────────
download_logo "logo-fenape.png" \
  "https://fenape.org.ec/wp-content/uploads/logo-fenape.png" \
  "https://fenape.org.ec/images/logo.png" \
  "FENAPE"

# ── RRUE — Red de Radios Universitarias del Ecuador ───────────────────────────
download_logo "logo-rrue.png" \
  "https://rrue.edu.ec/wp-content/uploads/logo-rrue.png" \
  "https://rrue.edu.ec/images/logo.png" \
  "RRUE"

# ── COLPB — Colegio de Periodistas de Bolívar ─────────────────────────────────
download_logo "logo-colpb.png" \
  "https://colegioperiodistasbolivar.org/wp-content/uploads/logo-colpb.png" \
  "" \
  "Colegio de Periodistas de Bolívar"

echo ""
echo "========================================================"
echo "  Resultado final:"
echo "========================================================"
echo ""
ls -lh "$DEST/" 2>/dev/null || echo "  (directorio vacío)"

# Contar cuántos se descargaron
TOTAL=$(ls "$DEST/"*.png 2>/dev/null | wc -l)
echo ""
echo "  📊 Logos descargados: $TOTAL / 9"
echo ""

if [ "$TOTAL" -lt 9 ]; then
  echo "  ⚠️  Logos faltantes — busca manualmente en los sitios oficiales:"
  echo "     UMAYOR: https://umayor.edu.co"
  echo "     UTE:    https://www.ute.edu.ec"
  echo "     UEB:    https://www.ueb.edu.ec"
  echo "     UTA:    https://www.uta.edu.ec"
  echo "     UPSE:   https://www.upse.edu.ec"
  echo "     UINL:   https://uinl.edu.ec"
  echo "     FENAPE: https://fenape.org.ec"
  echo ""
  echo "  Guárdalos como: public/images/logos/logo-[sigla].png"
fi

echo ""
echo "  ✅ Listo. Los logos se usan en:"
echo "     src/pages/public/Home.tsx  (marquee de instituciones)"
echo "     src/pages/public/Organizers.tsx"
