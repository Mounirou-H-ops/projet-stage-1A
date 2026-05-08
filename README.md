# 📬 Projet Stage — Outil de Prospection de Stage au Maroc

> Interface web permettant de filtrer une base de données d'entreprises marocaines 
> et d'envoyer son CV directement par email aux contacts RH sélectionnés.

## 🎯 Présentation
Ce projet automatise la recherche de stage au Maroc. L'outil parse un PDF 
d'entreprises, expose les données via une API REST Flask, et offre une interface 
web pour filtrer, sélectionner et contacter les entreprises cibles.

## ✨ Fonctionnalités
- 🔍 Filtrage dynamique par ville, secteur et groupe
- ☑️ Sélection multiple d'entreprises
- 📤 Envoi de CV par email aux contacts RH sélectionnés
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

## 📌 Améliorations prévues
- [ ] Matching IA profil/secteur
- [ ] Historique des envois  
- [ ] Export CSV de la sélection