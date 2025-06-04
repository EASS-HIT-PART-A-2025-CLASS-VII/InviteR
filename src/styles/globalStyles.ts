import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    direction: rtl;
    font-family: 'Rubik', Arial, sans-serif;
    background-color: #f5f5f5;
  }

  /* RTL specific styles */
  .MuiTableCell-root {
    text-align: right;
  }

  .MuiFormControl-root {
    text-align: right;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

export default GlobalStyles; 