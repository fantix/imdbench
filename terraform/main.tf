terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.3"
    }
  }
}

variable "region" {
  type    = string
  default = "us-east-2"
}

variable "vercel_api_token" {
  type        = string
  nullable    = false
  sensitive   = true
  description = "The Vercel access token you created previously."
}

variable "vercel_team_slug" {
  type        = string
  default     = null
  description = "Your Vercel team slug, leave empty to use the default one."
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_slug
}

resource "vercel_project" "imdbench" {
  name                       = "imdbench"
  framework                  = "nextjs"
  serverless_function_region = lookup({
    us-east-2 = "cle1"
  }, var.region)
}

data "vercel_project_directory" "imdbench" {
  path = "../vercel"
}

resource "vercel_deployment" "imdbench" {
  project_id  = vercel_project.imdbench.id
  files       = data.vercel_project_directory.imdbench.files
  path_prefix = "../vercel"
  production  = true
}

output "vercel_url" {
  value = vercel_deployment.imdbench.url
}
