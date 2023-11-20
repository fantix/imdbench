terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.3"
    }
    planetscale = {
      source  = "planetscale/planetscale"
      version = "~> 0.0.7"
    }
  }
}

variable "region" {
  type    = string
  default = "us-east-2"
}

variable "pscale_service_token_name" {
  type        = string
  nullable    = false
  sensitive   = true
  description = "ID of the PlanetScale service token to use"
}

variable "pscale_service_token" {
  type        = string
  nullable    = false
  sensitive   = true
  description = "Secret for the service token"
}

variable "pscale_org" {
  type     = string
  nullable = false
}

provider "planetscale" {
  service_token_name = var.pscale_service_token_name
  service_token      = var.pscale_service_token
}

resource "planetscale_database" "imdbench" {
  organization = var.pscale_org
  name         = "imdbench"
  plan         = "scaler_pro"
  cluster_size = "PS_10"
  region       = lookup({
    us-east-2 = "aws-us-east-2"
  }, var.region)
}

resource "planetscale_branch" "imdbench" {
  organization  = var.pscale_org
  database      = planetscale_database.imdbench.name
  name          = "imdbench"
  parent_branch = "main"
  production    = true
}

resource "planetscale_password" "imdbench" {
  organization = var.pscale_org
  database     = planetscale_database.imdbench.name
  branch       = planetscale_branch.imdbench.name
  name         = "imdbench"
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
  production  = false
}

resource "vercel_project_environment_variable" "imdbench" {
  key        = "pscale_url"
  project_id = vercel_project.imdbench.id
  target     = ["preview", "production"]
  value      = "mysql://${planetscale_password.imdbench.username}:${planetscale_password.imdbench.plaintext}@${planetscale_branch.imdbench.mysql_address}/${planetscale_database.imdbench.name}?sslaccept=strict"
}

output "vercel_url" {
  value = "https://${vercel_deployment.imdbench.url}/api/ids"
}
