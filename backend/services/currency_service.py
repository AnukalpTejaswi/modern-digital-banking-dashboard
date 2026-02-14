import requests

def fetch_exchange_rates(base_currency: str):
    url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
    response = requests.get(url)

    if response.status_code != 200:
        raise Exception("Failed to fetch exchange rates")

    return response.json()


def convert_amount(amount: float, from_currency: str, to_currency: str, rates_data: dict):
    if from_currency == to_currency:
        return amount

    rates = rates_data["rates"]

    if from_currency not in rates or to_currency not in rates:
        raise Exception("Currency not supported")

    base_amount = amount / rates[from_currency]
    converted = base_amount * rates[to_currency]

    return round(converted, 2)
