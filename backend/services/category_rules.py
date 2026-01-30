from typing import Dict, List


CATEGORY_RULES: Dict[str, List[str]] = {
    "Income": ["salary", "payroll", "income"],
    "Food": ["zomato", "swiggy", "restaurant", "cafe", "dining", "food"],
    "Groceries": ["grocery", "supermarket", "bigbasket"],
    "Transport": ["uber", "ola", "rapido", "bus", "metro"],
    "Bills": ["electricity", "water", "gas", "recharge"],
    "Shopping": ["amazon", "flipkart", "myntra", "ebay", "shopping", "meesho", "ajio"],
    "Entertainment": ["netflix", "spotify", "prime","cinema","gaming"],
    "Health": ["hospital", "pharmacy", "clinic"],
    "Education": ["school", "college", "university", "course", "tuition"],
    "Others": []
}

def normalize(text: str) -> str:
    return text.lower().strip()

def find_category(text: str) -> str | None:
    text = normalize(text)

    for category, keywords in CATEGORY_RULES.items():
        for kw in keywords:
            if kw in text:
                return category

    return None


def add_keyword_to_category(category: str, keyword: str):
    keyword = normalize(keyword)
    if category not in CATEGORY_RULES:
        CATEGORY_RULES[category] = []
    if keyword not in CATEGORY_RULES[category]:
        CATEGORY_RULES[category].append(keyword)

def remove_keyword_from_category(category: str, keyword: str):
    keyword = normalize(keyword)
    if category in CATEGORY_RULES and keyword in CATEGORY_RULES[category]:
        CATEGORY_RULES[category].remove(keyword)

def get_all_categories():
    return CATEGORY_RULES
