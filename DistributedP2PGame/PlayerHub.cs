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
            Player newPlayer = new Player() { Id = Context.ConnectionId, Name = name, X = rand.Next(20, 1000), Bullets = new List<Bullet>() };
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
        public void MovePlayer(string playerId, int x)
        {
            Player player = players.First(p => p.Id == playerId);
            player.X = x;
            players.Remove(player);
            players.Add(player);
            Clients.Others.getAllPlayers(players.ToArray());
        }

        //Returns an array of all players
        public void GetAllPlayers()
        {
            //Return to Caller
            Clients.Caller.getAllPlayers(players.ToArray());
        }

        public void AddNewBullet(string playerId)
        {
            Player player = players.First(p => p.Id == playerId);
            string bulletId = playerId + "-" + player.Bullets.Count;
            player.Bullets.Add(new Bullet { Id = bulletId });
            players.Remove(player);
            players.Add(player);
            Clients.All.getAllPlayers(players.ToArray());
        }

        //Save Bullet
        public void SaveBulletInformation(Player playerObj)
        {
            players[players.IndexOf(playerObj)] = playerObj;
            Clients.Others.getAllPlayers(players.ToArray());
        }

        //Save BulletMap
        public void SaveBulletInformation(BulletMap[] bulletsArr)
        {
            //Loop through Bullets
            for(int i = 0; i < bulletsArr.Length; i++)
            {
                var player = players.Where(p => p.Id == bulletsArr[i].PlayerID).First();
                player.Bullets = player.Bullets.Where(b => b.Id != bulletsArr[i].BulletID).ToList();
                players.Remove(player);
                players.Add(player);
            }
        }
    }

    //BulletMap Data
    public sealed class BulletMap
    {
        //BulletID
        public string BulletID { get; set; }

        //Player ID
        public string PlayerID { get; set; }
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

        //Bullets
        public List<Bullet> Bullets { get; set; }

        public override bool Equals(object obj)
        {
            Player other = obj as Player;

            if (other != null)
            {
                if (other.Id == Id)
                {
                    return true;
                }
            }

            return false;
        }
    }

    //Bullet Object
    public sealed class Bullet
    {
        public string Id { get; set; }
        public override bool Equals(object obj)
        {
            //Check Bullets
            Bullet bullet = (Bullet)obj;

            //Null Check
            if(bullet != null)
            {
                if(bullet.Id == Id)
                {
                    return true;
                }
            }
            return false;
        }
    }
}