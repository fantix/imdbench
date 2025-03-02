"""empty message

Revision ID: 549d8cfe5668
Revises:
Create Date: 2018-09-14 15:11:31.441482

"""
import os
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "549d8cfe5668"
down_revision = None
branch_labels = None
depends_on = None

VARCHAR_LEN = None
USE_CONSTRAINT = True
if os.environ.get("IMDBENCH_EXTRA_ENV") == "planetscale":
    VARCHAR_LEN = 255
    USE_CONSTRAINT = False


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "movie",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("image", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column("title", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(VARCHAR_LEN), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "person",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column(
            "middle_name", sa.String(VARCHAR_LEN), server_default="", nullable=False
        ),
        sa.Column("last_name", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column("image", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column("bio", sa.String(VARCHAR_LEN), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column("image", sa.String(VARCHAR_LEN), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        sa.sql.quoted_name("cast", True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("list_order", sa.Integer(), nullable=True),
        sa.Column("person_id", sa.Integer(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=False),
        *(
            [
                sa.ForeignKeyConstraint(
                    ["movie_id"],
                    ["movie.id"],
                ),
                sa.ForeignKeyConstraint(
                    ["person_id"],
                    ["person.id"],
                ),
            ]
            if USE_CONSTRAINT
            else []
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_cast_movie_id"),
        sa.sql.quoted_name("cast", True),
        ["movie_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_cast_person_id"),
        sa.sql.quoted_name("cast", True),
        ["person_id"],
        unique=False,
    )
    op.create_table(
        "directors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("list_order", sa.Integer(), nullable=True),
        sa.Column("person_id", sa.Integer(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=False),
        *(
            [
                sa.ForeignKeyConstraint(
                    ["movie_id"],
                    ["movie.id"],
                ),
                sa.ForeignKeyConstraint(
                    ["person_id"],
                    ["person.id"],
                ),
            ]
            if USE_CONSTRAINT
            else []
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_directors_movie_id"), "directors", ["movie_id"], unique=False
    )
    op.create_index(
        op.f("ix_directors_person_id"), "directors", ["person_id"], unique=False
    )
    op.create_table(
        "review",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("body", sa.String(VARCHAR_LEN), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("creation_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=False),
        *(
            [
                sa.ForeignKeyConstraint(
                    ["author_id"],
                    ["user.id"],
                ),
                sa.ForeignKeyConstraint(
                    ["movie_id"],
                    ["movie.id"],
                ),
            ]
            if USE_CONSTRAINT
            else []
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_review_author_id"), "review", ["author_id"], unique=False)
    op.create_index(op.f("ix_review_movie_id"), "review", ["movie_id"], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_review_movie_id"), table_name="review")
    op.drop_index(op.f("ix_review_author_id"), table_name="review")
    op.drop_table("review")
    op.drop_index(op.f("ix_directors_person_id"), table_name="directors")
    op.drop_index(op.f("ix_directors_movie_id"), table_name="directors")
    op.drop_table("directors")
    op.drop_index(
        op.f("ix_cast_person_id"), table_name=sa.sql.quoted_name("cast", True)
    )
    op.drop_index(op.f("ix_cast_movie_id"), table_name=sa.sql.quoted_name("cast", True))
    op.drop_table(sa.sql.quoted_name("cast", True))
    op.drop_table("user")
    op.drop_table("person")
    op.drop_table("movie")
    # ### end Alembic commands ###
