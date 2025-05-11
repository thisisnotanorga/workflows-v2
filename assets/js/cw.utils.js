//Cw.utils.js | Utility functions for classic window

function cs(html) { //cs for convert styles, ik its not conversion but as (add styles) is proteged
    return `
        <style>
            a {
                color: rgb(129, 170, 197);
                text-decoration: none;
            }

            bold {
                font-weight: bold;
            }

            italic {
                font-style: italic;
            }

            underline {
                text-decoration: underline;
            }

            strikethrough {
                text-decoration: line-through;
            }

            small {
                font-size: 0.8em;
            }

            large {
                font-size: 1.2em;
            }

            hand {
                display: inline-block;
                animation: moveHand 1s infinite;
                transform-origin: bottom left;
            }

            @keyframes moveHand {
                0% {
                    transform: rotate(0deg);
                }

                50% {
                    transform: rotate(20deg);
                }

                100% {
                    transform: rotate(0deg);
                }
            }
        </style>

    
    ${html}`;
}
