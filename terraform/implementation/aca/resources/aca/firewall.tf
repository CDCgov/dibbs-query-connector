resource "azurerm_web_application_firewall_policy" "aca_waf_policy" {
  name                = "${local.name}-wafpolicy"
  resource_group_name = var.resource_group_name
  location            = var.location

  custom_rules {
    name      = "USOnly"
    priority  = 1
    rule_type = "MatchRule"

    match_conditions {
      match_variables {
        variable_name = "RemoteAddr"
      }
      operator           = "GeoMatch"
      negation_condition = false
      match_values = [
        "US" //United States
      ]
    }
    action = "Allow"
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
  }

  policy_settings {
    enabled                     = true
    mode                        = "Detection" //Can use "Detection" for testing, to see which requests would be blocked. "Prevention" turns on active blocking.
    request_body_check          = true
    file_upload_limit_in_mb     = 100
    max_request_body_size_in_kb = 1024 //Can go to 2000 in modern provider version. Proposed is 1024.
  }
}