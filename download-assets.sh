#!/bin/bash
# Descarga imágenes del carrusel SEMS
# Uso: cd ~/Desktop/sems_ui && bash download-assets.sh

mkdir -p public/images

echo "Descargando imágenes del carrusel..."
curl -sL "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1400&q=80" -o "public/images/carousel-1.jpg" && echo "  carousel-1.jpg OK"
curl -sL "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1400&q=80" -o "public/images/carousel-2.jpg" && echo "  carousel-2.jpg OK"
curl -sL "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&q=80" -o "public/images/carousel-3.jpg" && echo "  carousel-3.jpg OK"
curl -sL "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=1400&q=80" -o "public/images/carousel-4.jpg" && echo "  carousel-4.jpg OK"
curl -sL "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1400&q=80" -o "public/images/carousel-5.jpg" && echo "  carousel-5.jpg OK"
curl -sL "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=1400&q=80" -o "public/images/carousel-6.jpg" && echo "  carousel-6.jpg OK"

echo "Listo. Copia hero-bg.jpg también a public/images/"
ls -lh public/images/
