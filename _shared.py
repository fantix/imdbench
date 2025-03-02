#
# Copyright (c) 2019 MagicStack Inc.
# All rights reserved.
#
# See LICENSE for details.
##


import argparse
import sys
import types
import typing


from _edgedb import queries_json as edgedb_queries_json
from _edgedb import queries_async as edgedb_queries_async
from _edgedb import queries_repack as edgedb_queries_repack
from _go.edgedb import queries_edgedb as edgedb_json_golang
from _go.postgres import queries_pq as postgres_pq_golang
from _go.postgres import queries_pgx as postgres_pgx_golang
from _go.http import queries_graphql as edgedb_graphql_golang
from _go.http import queries_hasura as postgres_hasura_golang
from _go.http import queries_postgraphile as postgres_postgraphile_golang
from _go.http import queries_http as edgedb_edgeql_golang
from _django import queries as django_queries
from _django import queries_restfw as django_queries_restfw
from _mongodb import queries as mongodb_queries
from _sqlalchemy import queries as sqlalchemy_queries
from _sqlalchemy import queries_asyncio as sqlalchemy_queries_asyncio
from _postgres import queries as postgres_queries
from _postgres import queries_psycopg as postgres_psycopg_queries


class impl(typing.NamedTuple):
    language: str
    title: str
    module: typing.Optional[types.ModuleType]
    extra_env: typing.Optional[str] = None


IMPLEMENTATIONS = {

    'edgedb_py_json':
        impl('python', 'EdgeDB (Python, JSON)', edgedb_queries_json),

    'edgedb_py_json_async':
        impl('python', 'EdgeDB (Python, JSON, asyncio)', edgedb_queries_async),

    'edgedb_py_sync':
        impl('python', 'EdgeDB (Python)', edgedb_queries_repack),

    'edgedb_go':
        impl('go', 'EdgeDB (Go)', edgedb_json_golang),

    'edgedb_go_json':
        impl('go', 'EdgeDB (Go, JSON)', edgedb_json_golang),

    'edgedb_go_graphql':
        impl('go', 'EdgeDB (GraphQL)', edgedb_graphql_golang),

    'edgedb_go_http':
        impl('go', 'EdgeDB (HTTP)', edgedb_edgeql_golang),

    'django':
        impl('python', 'Django ORM', django_queries),

    'django_restfw':
        impl('python', 'Django (Rest Framework)', django_queries_restfw),

    'mongodb':
        impl('python', 'MongoDB (Python)', mongodb_queries),

    'sqlalchemy':
        impl('python', 'SQLAlchemy', sqlalchemy_queries),

    'sqlalchemy_asyncio':
        impl('python', 'SQLAlchemy (asyncio)', sqlalchemy_queries_asyncio),

    'supabase_sqla':
        impl(
            'python',
            'Supabase (Python, SQLAlchemy, asyncio)',
            sqlalchemy_queries_asyncio,
            'supabase',
        ),

    'planetscale_sqla':
        impl(
            'python',
            'PlanetScale (Python, SQLAlchemy)',
            sqlalchemy_queries,
            'planetscale',
        ),

    'postgres_asyncpg':
        impl('python', 'PostgreSQL (Python, asyncpg)', postgres_queries),

    'postgres_psycopg':
        impl('python', 'PostgreSQL (Pyhton, psycopg2)', postgres_psycopg_queries),

    'postgres_pq':
        impl('go', 'PostgreSQL (Go, pq)', postgres_pq_golang),

    'postgres_pgx':
        impl('go', 'PostgreSQL (Go, pgx)', postgres_pgx_golang),

    'postgres_hasura_go':
        impl('go', 'Hasura + Postgres (Go)', postgres_hasura_golang),

    'postgres_postgraphile_go':
        impl('go', 'Postgraphile (Go)',
             postgres_postgraphile_golang),

    'edgedb_js':
        impl('js', 'EdgeDB (Node.js)', None),

    'edgedb_js_json':
        impl('js', 'EdgeDB (Node.js, JSON mode)', None),

    'edgedb_js_qb':
        impl('js', 'EdgeDB (Node.js, query builder)', None),

    'edgedb_js_qb_uncached':
        impl('js', 'EdgeDB (Node.js, query builder, uncached)', None),

    'typeorm':
        impl('js', 'TypeORM', None),

    'sequelize':
        impl('js', 'Sequelize', None),

    'postgres_pg':
        impl('js', 'PostgreSQL (Node.js, pg)', None),

    'prisma_untuned':
        impl('js', 'Prisma (Untuned)', None),

    'prisma':
        impl('js', 'Prisma', None),

    'edgedb_dart':
        impl('dart', 'EdgeDB (Dart)', None),

    'edgedb_dart_json':
        impl('dart', 'EdgeDB (Dart, JSON mode)', None),

    'postgres_dart':
        impl('dart', 'Postgres (Dart)', None),
}


class bench(typing.NamedTuple):
    title: str
    description: str


BENCHMARKS = {
    'get_movie':
        bench(
            title="GET /movie/:id",
            description=(
                "Get information about a given movie: title, year, directors, "
                "cast, recent reviews, and average review rating."
            )
        ),
    'get_person':
        bench(
            title="GET /person/:id",
            description=(
                "Get information about a given person: full name, bio, "
                "list of movies acted in or directed."
            )
        ),
    'get_user':
        bench(
            title="GET /user/:id",
            description=(
                "Get information about a given user: name and a sample of "
                "the latest movie reviews this user authored."
            )
        ),
    'update_movie':
        bench(
            title="PATCH /movie/:id",
            description=(
                "Update the title of a movie."
            )
        ),
    'insert_user':
        bench(
            title="POST /user",
            description=(
                "Create a new user record."
            )
        ),
    'insert_movie':
        bench(
            title="POST /movie (existing cast)",
            description=(
                "Create a new movie record, linking existing directors "
                "and cast."
            )
        ),
    'insert_movie_plus':
        bench(
            title="POST /movie (new cast)",
            description=(
                "Create a new movie record, linking newly inserted directors "
                "and cast."
            )
        ),
}


def parse_args(*, prog_desc: str, out_to_json: bool = False,
               out_to_html: bool = False):
    parser = argparse.ArgumentParser(
        description=prog_desc,
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument(
        '-C', '--concurrency', type=int, default=1,
        help='number of concurrent connections')

    parser.add_argument(
        '--async-split', type=int, default=1,
        help='number of processes to split Python async connections')

    parser.add_argument(
        '--db-host', type=str, default='127.0.0.1',
        help='host with databases')

    parser.add_argument(
        '-D', '--duration', type=int, default=30,
        help='duration of test in seconds')
    parser.add_argument(
        '--timeout', default=2, type=int,
        help='server timeout in seconds')
    parser.add_argument(
        '--warmup-time', type=int, default=5,
        help='duration of warmup period for each benchmark in seconds')
    parser.add_argument(
        '--net-latency', default=0, type=int,
        help='assumed p0 roundtrip latency between a database and a client')
    parser.add_argument(
        '--pg-port', type=int, default=15432,
        help='PostgreSQL server port')

    parser.add_argument(
        '--edgedb-port', type=int, default=None,
        help='EdgeDB server port')

    parser.add_argument(
        '--mongodb-port', type=int, default=27017,
        help='MongoDB server port')

    parser.add_argument(
        '--number-of-ids', type=int, default=250,
        help='number of random IDs to fetch data with in benchmarks')

    parser.add_argument(
        '--query', dest='queries', action='append',
        help='queries to benchmark',
        choices=list(BENCHMARKS.keys()) + ['all'])

    parser.add_argument(
        'benchmarks', nargs='+', help='benchmarks names',
        choices=list(IMPLEMENTATIONS.keys()) + ['all'])

    if out_to_json:
        parser.add_argument(
            '--json', type=str, default='',
            help='filename to dump serialized results in JSON')

    if out_to_html:
        parser.add_argument(
            '--html', type=str, default='',
            help='filename to dump HTML report')

    args = parser.parse_args()
    argv = sys.argv[1:]

    if not args.queries:
        args.queries = list(BENCHMARKS.keys())

    if args.concurrency % args.async_split != 0:
        raise Exception(
            "'--concurrency' must be an integer multiple of '--async-split'")

    if 'all' in args.benchmarks:
        args.benchmarks = list(IMPLEMENTATIONS.keys())

    if out_to_json and args.json:
        i = argv.index('--json')
        del argv[i:i + 2]

    if out_to_html and args.html:
        i = argv.index('--html')
        del argv[i:i + 2]

    return args, argv
