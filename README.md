# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

Users can register with their email address.
!["Register Page"](./docs/register-page.png)

The index page will show all URLs created and owned by the user. Also shown are the creation date, total visits and unique visits.
!["URLs Index Page"](./docs/urls-index-page.png)

Users can also change where the short URL points to without the need to creating a new one.
!["URLs Edit Page"](./docs/urls-edit-page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- randomstring

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Register for a new account. Alternatively, explore with an existing test account (email: test@email.com, password: test).