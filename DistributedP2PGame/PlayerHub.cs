using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace DistributedP2PGame
{
    public class PlayerHub : Hub
    {
        //Memeber List
        private static List<Player> players = new List<Player>();

        //Disconnect Event
        public override Task OnDisconnected(bool stopCalled)
        {
            RemovePlayer(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
        }

        public void Send(string name, string message)
        {
            // Call the broadcastMessage method to update clients.
            Clients.All.broadcastMessage(name, message);
        }

        //Creates a new Player
        public void NewPlayer(string name)
        {
            //Add to List
            Random rand = new Random();
            Player newPlayer = new Player() { Id = Context.ConnectionId, Name = name, X = rand.Next(20, 1000) };
            players.Add(newPlayer);

            //Emit new Player
            Clients.All.newPlayer(newPlayer);
        }

        public void RemovePlayer(string id)
        {
            //Remove Player from the List of Players
            var player = players.First(p => p.Id == id);
            players.Remove(player);
            Clients.All.removePlayer(player);
        }

        //Move a specific Player
        public void MovePlayer(int playerId, int x)
        {
            Player player = players[playerId];
            player.X = x;
            players[playerId] = player;
        }

        //Returns an array of all players
        public void GetAllPlayers()
        {
            //Return to Caller
            Clients.Caller.getAllPlayers(players.ToArray());
        }
    }

    //Player Obj
    public sealed class Player
    {
        //UniqueID
        public string Id { get; set; }

        //Name
        public string Name { get; set; }

        //Location
        public int X { get; set; }

        public override bool Equals(object obj)
        {
            Player other = obj as Player;

            if(other != null)
            {
                if(other.Id == Id)
                {
                    return true;
                }
            }

            return false;
        }
    }
}