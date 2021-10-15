import requests
import sys
import time

local_url = "http://localhost:8119"
testnet_url = "http://godwoken-testnet-web3-rpc.ckbapp.dev"
payload = {
    "jsonrpc": "2.0", "method": "gw_get_tip_block_hash", "params": [], "id": 1
}

local_err_cnt = 0
remote_err_cnt = 0

err_limit = 3  # retry 3 times after failure


def get_tip_block_hash(url) -> str:
    res = requests.post(url, json=payload)
    return res.json()['result']


def get_tip_number(hash: str) -> int:
    payload = {
        "jsonrpc": "2.0", "method": "gw_get_block", "params": [hash], "id": 1
    }
    res = requests.post(testnet_url, json=payload)
    block_number = int(res.json()['result']['block']['raw']['number'], 16)
    return block_number


# Check sync status every 10 sec.
# Stop when we hit errors or we sync the same tip hash as testnet does.
while True:
    time.sleep(10)
    try:
        local_tip = get_tip_block_hash(local_url)
    except:
        if local_err_cnt < err_limit:
            local_err_cnt += 1
            print('local error: ', sys.exc_info()[0])
            continue
    try:
        remote_tip = get_tip_block_hash(testnet_url)
    except:
        if remote_err_cnt < err_limit:
            remote_err_cnt += 1
            print('remote error: ', sys.exc_info()[0])
            continue
    local_err_cnt = 0
    remote_err_cnt = 0
    if local_tip == remote_tip:
        break
    else:
        print("Current: ", str(get_tip_number(local_tip)))

print('SYNC TO TIP SUCCESSFULLY!!! Finally!!!')
