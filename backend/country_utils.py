import re

COUNTRY_ALIASES = {
    "IN": "IN",
    "INDIA": "IN",
    "US": "US",
    "USA": "US",
    "U S A": "US",
    "UNITED STATES": "US",
    "UNITED STATES OF AMERICA": "US",
    "GB": "GB",
    "UK": "GB",
    "U K": "GB",
    "UNITED KINGDOM": "GB",
    "GREAT BRITAIN": "GB",
    "AE": "AE",
    "UAE": "AE",
    "UNITED ARAB EMIRATES": "AE",
    "CA": "CA",
    "CANADA": "CA",
    "AU": "AU",
    "AUSTRALIA": "AU",
    "DE": "DE",
    "GERMANY": "DE",
    "FR": "FR",
    "FRANCE": "FR",
    "JP": "JP",
    "JAPAN": "JP",
    "SG": "SG",
    "SINGAPORE": "SG",
    "BR": "BR",
    "BRAZIL": "BR",
    "CN": "CN",
    "CHINA": "CN",
    "IT": "IT",
    "ITALY": "IT",
    "NL": "NL",
    "NETHERLANDS": "NL",
    "ES": "ES",
    "SPAIN": "ES",
    "SE": "SE",
    "SWEDEN": "SE",
    "CH": "CH",
    "SWITZERLAND": "CH",
    "ZA": "ZA",
    "SOUTH AFRICA": "ZA",
    "NZ": "NZ",
    "NEW ZEALAND": "NZ",
    "MY": "MY",
    "MALAYSIA": "MY",
    "ID": "ID",
    "INDONESIA": "ID",
    "KR": "KR",
    "KOREA": "KR",
    "SOUTH KOREA": "KR",
    "KP": "KP",
    "NORTH KOREA": "KP",
    "AT": "AT",
    "AUSTRIA": "AT",
    "BE": "BE",
    "BELGIUM": "BE",
    "IE": "IE",
    "IRELAND": "IE",
    "DK": "DK",
    "DENMARK": "DK",
    "NO": "NO",
    "NORWAY": "NO",
    "FI": "FI",
    "FINLAND": "FI",
    "PT": "PT",
    "PORTUGAL": "PT",
    "NL": "NL",
    "NETHERLANDS": "NL",
}


def normalize_country_code(value: str) -> str:
    if value is None:
        raise ValueError("Country value is required.")

    raw_value = str(value).strip()
    if not raw_value:
        raise ValueError("Country value cannot be empty.")

    candidate = raw_value.strip().upper()
    if "-" in candidate:
        candidate = candidate.split("-")[0].strip()

    if len(candidate) == 2 and candidate.isalpha():
        return candidate

    uppercase_value = candidate
    compact_value = re.sub(r"[^A-Z]", "", uppercase_value)
    if compact_value in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[compact_value]

    cleaned_value = re.sub(r"\s+", " ", uppercase_value).strip()
    if cleaned_value in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[cleaned_value]

    # Accept common punctuation/country name variants such as "U.S.A." and "United States of America"
    for key in (cleaned_value, cleaned_value.replace(".", ""), cleaned_value.replace("-", " ")):
        if key in COUNTRY_ALIASES:
            return COUNTRY_ALIASES[key]

    raise ValueError(f"Unsupported country value '{value}'. Use a standard ISO alpha-2 code or a supported country name.")
