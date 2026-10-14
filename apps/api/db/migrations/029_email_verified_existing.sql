-- Login phase 3: new accounts must confirm their email. The accounts created before that are trusted as they are.
update "user" set "emailVerified" = true where not "emailVerified";
