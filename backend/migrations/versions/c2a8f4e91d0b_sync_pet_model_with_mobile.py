"""sync_pet_model_with_mobile

Revision ID: c2a8f4e91d0b
Revises: b17b317c1bb3
Create Date: 2026-09-23
"""
from alembic import op
import sqlalchemy as sa


revision = 'c2a8f4e91d0b'
down_revision = 'b17b317c1bb3'
branch_labels = None
depends_on = None


def upgrade():
    # Rename 'body' → 'body_color', drop 'color', add 'outfit'
    with op.batch_alter_table('pets') as batch_op:
        batch_op.alter_column('body', new_column_name='body_color')
        batch_op.drop_column('color')
        batch_op.add_column(sa.Column('outfit', sa.String(length=20), nullable=False, server_default='hoodie_teal'))


def downgrade():
    with op.batch_alter_table('pets') as batch_op:
        batch_op.drop_column('outfit')
        batch_op.add_column(sa.Column('color', sa.String(length=20), nullable=False, server_default='mint'))
        batch_op.alter_column('body_color', new_column_name='body')
