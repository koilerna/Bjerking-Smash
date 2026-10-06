# Bjerking Smash

Färdig statisk MVP för GitHub, Vercel och Supabase. Appen innehåller startsida, ranking beräknad från matcher, senaste matcher, statistik och ett formulär för att registrera resultat.

## Publicera
1. Packa upp zip-filen.
2. Ladda upp mapparna och filerna till roten av GitHub-repot `Bjerking-Smash`.
3. Vercel publicerar nästa commit automatiskt om repot redan är anslutet.

## Koppla Supabase
1. Öppna `supabase/schema.sql`, kopiera allt och kör i Supabase SQL Editor.
2. Hämta Project URL och publishable/anon key från Supabase Project Settings > API.
3. Öppna `js/config.js` i GitHub och ersätt platshållarna.
4. Commit changes.

Använd aldrig `service_role`-nyckeln i webbläsaren.

## Viktigt om befintliga tabeller
Appen använder tabellnamnen `players` och `matches` med små bokstäver. Om tabellerna skapats som `Players` och `Matches` bör schemafilen användas för att skapa den korrekta strukturen. Kontrollera data innan gamla tabeller tas bort.

## Nästa säkra steg
MVP-policyn låter anonyma besökare registrera matcher. Innan appen sprids brett bör Supabase Auth läggas till och insert-policyn begränsas till inloggade användare.
