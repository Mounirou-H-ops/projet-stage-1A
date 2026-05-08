# 📬 Projet d'Annuaire

> Interface web permettant de filtrer une base de données d'entreprises marocaines 
> et d'envoyer directement un mail aux contacts sélectionnés.

## 🎯 Présentation
Ce projet automatise la recherche de contacts au sein d'entreprises au Maroc. L'outil parse un PDF 
d'entreprises, expose les données via une API REST Flask, et offre une interface 
web pour filtrer, sélectionner et contacter les entreprises cibles. je l'utilise principalement pour ma recherche de stage mais d'autres applications sont possibles.

## ✨ Fonctionnalités
- 🔍 Filtrage dynamique par ville, secteur et groupe
- ☑️ Sélection multiple d'entreprises
- 📤 Envoi de mail aux contacts sélectionnés
- 📄 Parsing automatique PDF → JSON

## 🛠️ Stack
| Couche | Technologie |
|--------|-------------|
| Backend | Python · Flask · Flask-CORS |
| Parsing | pdfplumber |
| Email | smtplib (SMTP Gmail) |
| Frontend | HTML · CSS · JavaScript |

## ⚙️ Installation
pip install flask pdfplumber flask-cors python-dotenv

## 🔒 Sécurité
Le fichier .env (credentials SMTP) est exclu du dépôt via .gitignore.

## 📌 Points failbes de la base de données
- la majorité des entreprises sont concentrées à Casablanca 
- certaines entreprises n'y sont pas 
- certaines informations sont erronées