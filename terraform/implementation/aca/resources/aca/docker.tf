resource "time_static" "now" {}

resource "dockerless_remote_image" "dibbs" {
  for_each = local.building_block_definitions
  source   = "${var.ghcr_string}${each.key}:${each.value.app_version}"
  target   = "${var.acr_url}/${each.value.name}:${each.value.app_version}"
}