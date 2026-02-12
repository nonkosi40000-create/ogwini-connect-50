-- Delete admin auth users so they can re-register
DELETE FROM auth.users WHERE id IN ('79f6b337-f97e-4966-a6be-b1d827f08935', '472a03bb-bbad-424e-9bad-5f580c2ee3c0');