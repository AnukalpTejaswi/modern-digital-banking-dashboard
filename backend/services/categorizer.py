from .category_rules import find_category

def auto_assign_category(text: str) -> str:
    text = text.lower().strip()

    category = find_category(text)
    if category:
        return category

    return "Others"
