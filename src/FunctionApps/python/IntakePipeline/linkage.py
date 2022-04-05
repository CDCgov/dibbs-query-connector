import hashlib


def add_patient_identifier(salt_suffix: str, bundle: dict) -> None:
    """
    Given a FHIR resource bundle (defined as a dictionary of resources
    containing at least one patient resource):
      - identify the patient resource(s) in the bundle
      - extract standardized name, DOB, and address information for each
      - compute a unique hash string based on these fields
      - add the hash string to the list of identifiers held in that
        patient resource
    This function assumes data has been standardized already by the
    silver transforms.
    """
    for resource in bundle["entry"]:
        if resource["resource"]["resourceType"] == "Patient":
            patient = resource["resource"]

            # Combine given and family name
            recent_name = patient["name"][0]
            name_str = "-".join(recent_name["given"]) + "-" + recent_name["family"]

            # Compile one-line address string
            address = patient["address"][0]
            address_line = " ".join(address.get("line"))
            address_line += f" {address.get('city')}, {address.get('state')}"
            if "postalCode" in address and address["postalCode"]:
                address_line += f" {address['postalCode']}"

            # Generate and store unique hash code
            link_str = name_str + "-" + patient["birthDate"] + "-" + address_line
            hashcode = generate_hash_str(link_str, salt_suffix)
            patient["identifier"].append(
                {
                    "value": hashcode,
                    # Note: this system value corresponds to the FHIR specification
                    # for a globally used / generated ID or UUID--the standard here
                    # is to make the use "temporary" even if it's not
                    "system": "urn:ietf:rfc:3986",
                    "use": "temp",
                }
            )


def generate_hash_str(linking_str: str, salt_str: str) -> str:
    """
    Given a string made of concatenated patient information, generate
    a hash for this string to serve as a "unique" identifier for the
    patient.
    """
    hash_obj = hashlib.sha256()
    to_encode = (linking_str + salt_str).encode("utf-8")
    hash_obj.update(to_encode)
    return str(hash_obj.hexdigest())
