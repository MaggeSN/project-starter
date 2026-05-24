"""Test fixture factories.

Use these instead of constructing model rows by hand when you need a row
that must not collide with seeded data. Seed migrations populate tables
that are NOT truncated between tests, so raw `Model(slug="known-value")`
in a test will hit `UniqueViolationError` if the slug is already seeded.

The factory generates `test-<prefix>-<random>` slugs that are guaranteed
not to collide with any seeded value.

Pattern:

    from tests import factories

    async def test_something(session_factory):
        async with session_factory() as s:
            row = factories.make_<model>(s, name="...")
            await s.flush()

Add per-model helpers as your project grows. Start with whichever models
your seed migrations populate.
"""

from __future__ import annotations

import uuid


def unique_slug(prefix: str) -> str:
    """Generate a slug guaranteed not to collide with any seeded value."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# Example: replace with your project's seeded models.
#
# def make_category(session, *, slug=None, name=None, parent_id=None):
#     from your_app.db.models import Category
#     cat = Category(
#         slug=slug or unique_slug("test-cat"),
#         name=name or "Test Category",
#         parent_id=parent_id,
#     )
#     session.add(cat)
#     return cat
