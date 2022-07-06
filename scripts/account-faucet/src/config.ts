const environment = {
  rpc: 'https://godwoken-testnet-v1.ckbapp.dev',
  accounts: [
    '1390c30e5d5867ee7246619173b5922d3b04009cab9e9d91e14506231281a997',
    '2dc6374a2238e414e51874f514b0fa871f8ce0eb1e7ecaa0aed229312ffc91b0',
    'dd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b',
  ],
};

// This function is used to handle external accounts (passing from CI or else)
function searchAccounts(prefix: string, env: NodeJS.ProcessEnv) {
  const keys = Object.keys(env).filter(key => new RegExp(`${prefix}(\d){0,}`).test(key));
  return keys.map(key => env[key]);
}

export default environment;