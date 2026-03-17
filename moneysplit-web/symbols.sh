add_icon() {
  curl -sSL "https://github.com/google/material-design-icons/raw/refs/heads/master/symbols/web/${1}/materialsymbolsoutlined/${1}_24px.svg" \
    -o "src/assets/symbols/${1}.svg" \
    -w "%{http_code}"

  echo "export { default as icon_${1} } from './${1}.svg?raw';" \
    >> "src/assets/symbols/index.ts"
}

rm "src/assets/symbols/index.ts"
add_icon undo
add_icon save
add_icon chevron_left
add_icon more_horiz
add_icon add_notes
add_icon visibility
add_icon visibility_off
add_icon delete
add_icon add
add_icon link
add_icon person_add
add_icon check
add_icon copy_all
add_icon attach_money
add_icon event
add_icon photo_camera
add_icon person
add_icon cloud_off
add_icon arrow_downward
