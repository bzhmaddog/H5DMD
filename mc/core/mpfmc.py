"""Contains the MpfMc base class, which is the main App instance for the
mpf-mc."""
import asyncio
import socket

import mpf
from mpf._version import __version__ as __mpfversion__
from mpf.core.config_loader import MpfMcConfig



try:
    from mpfmc.core.audio import SoundSystem
    from mpfmc.assets.sound import SoundAsset
except ImportError:
    SoundSystem = None
    SoundAsset = None
    logging.warning("mpfmc.core.audio library could not be loaded. Audio "
                    "features will not be available")


class MpfMc():
    # pylint: disable-msg=too-many-statements
    def __init__(self, options, config: MpfMcConfig, thread_stopper=None, loop = asyncio.get_event_loop()):
        #super().__init__()
        self.loop = loop
    
    async def handle_client(client):
        loop = asyncio.get_event_loop()
        request = None
        while request != 'quit':
            request = (await loop.sock_recv(client, 255)).decode('utf8')
            response = str(eval(request)) + '\n'
            await loop.sock_sendall(client, response.encode('utf8'))
        client.close()


    def run(self):
        try:
            self.BCPserver = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.BCPserver.bind(('localhost', 5050))
            self.BCPserver.listen(5)
            self.BCPserver.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.BCPserver.setblocking(False)

            while True:
                client, _ = await self.loop.sock_accept(self.BCPserver)
                self.loop.create_task(self.handle_client(client))


            self.loop.create_task(self.run_bcp_server())  



            self.loop.run_forever()
        finally:
            self.loop.run_until_complete(self.loop.shutdown_asyncgens())
            self.loop.close()