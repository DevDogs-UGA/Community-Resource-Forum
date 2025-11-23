data "external_schema" "drizzle" {
  program = [ 
    "tail",
    "-q",
    "-n",
    "+3",
    "migrations/ddl.sql",
    "migrations/overrides.sql",
  ]
}

env "local" {
  url = "mysql://root:${getenv("MYSQL_PASSWORD")}@mysql:3306/${getenv("MYSQL_DATABASE")}"
  dev = "mysql://root:password@mysql-dev:3306/dev"
  schema {
    src = data.external_schema.drizzle.url
  }
  migration {
    dir = "file://atlas/migrations"
  }
}

env "remote" {
  schema {
    src = data.external_schema.drizzle.url
  }
  migration {
    dir = "file://atlas/migrations"
  }
}