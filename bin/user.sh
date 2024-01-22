#!/bin/bash

# User credentials
USERNAME=$1
echo -n "Enter password: "
read -s PASSWORD
echo

# Database credentials
# source env/mariadb.env

# Generate bcrypt hash using htpasswd
HASHED_PASSWORD=$(htpasswd -Bbn "$USERNAME" "$PASSWORD" | cut -d ":" -f 2 | xargs)

# Check if hash was generated
if [ -z "$HASHED_PASSWORD" ]; then
    echo "Failed to generate bcrypt hash"
    exit 1
fi


# Insert into MySQL database
mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"$MYSQL_HOST" -D"$MYSQL_DATABASE" -e \
"INSERT INTO users (username, password_hash) VALUES ('$USERNAME', '$HASHED_PASSWORD')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);"

# Check if MySQL command was successful
if [ $? -ne 0 ]; then
    echo "Failed to insert into database"
    exit 1
fi

echo "User $USERNAME inserted successfully."
